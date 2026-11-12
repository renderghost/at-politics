/**
 * Nightly sync: EP roster → EP open data → Bluesky matching → data/*.json.
 * All-or-nothing: any source or validation failure exits non-zero and writes nothing.
 * Prints `confirmed-changed=true|false` (also to $GITHUB_OUTPUT) so CI can open a PR for new public links.
 */
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { toMep } from '../../src/core/ep';
import { blueskyRefsFromHomepages, classify, ownDomains, resolveMatches, type Candidate, type MepIdentity, type Scored } from '../../src/core/match';
import {
  AtmosphereFileSchema, MepsFileSchema, OverridesSchema, ReviewFileSchema,
  type AtmosphereFile, type Mep, type Overrides,
} from '../../src/core/schema';
import { uniqueSlugs } from '../../src/core/slug';
import { getProfiles, resolveHandle, searchActors, type Profile } from './bluesky';
import { fetchCurrentMeps, fetchDetails, fetchOrgLabels } from './ep';
import { mapLimit } from './http';

const DATA = new URL('../../data/', import.meta.url);
const CONCURRENCY = 4;
const log = (...a: unknown[]) => console.error('[sync]', ...a);

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(new URL(name, DATA), 'utf8')) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw err;
  }
}

/** Write only when content (ignoring generatedAt) changed, so unchanged data keeps its timestamp and makes no diff. */
async function writeIfChanged(name: string, value: { generatedAt: string }): Promise<boolean> {
  const previous = await readJson<{ generatedAt?: string } | null>(name, null);
  const strip = (v: object | null) => JSON.stringify({ ...v, generatedAt: undefined });
  if (previous && strip(previous) === strip(value)) return false;
  await writeFile(new URL(name, DATA), `${JSON.stringify(value, null, 2)}\n`);
  return true;
}

function identityOf(mep: Mep, resolvedRefs: string[]): MepIdentity {
  return {
    id: mep.id,
    givenName: mep.givenName,
    familyName: mep.familyName,
    homepages: mep.homepages,
    xHandles: mep.accounts.filter((a) => a.kind === 'x').map((a) => a.url),
    blueskyRefs: [...blueskyRefsFromHomepages(mep.homepages), ...resolvedRefs],
  };
}

async function main() {
  const now = new Date().toISOString();
  const overrides: Overrides = OverridesSchema.parse(await readJson('overrides.json', { approve: [], reject: [] }));

  // 1. European Parliament
  const roster = await fetchCurrentMeps();
  if (roster.length < 600 || roster.length > 760) throw new Error(`Roster has ${roster.length} MEPs; expected about 720. Refusing to publish.`);
  log(`current MEPs: ${roster.length}`);
  const details = await fetchDetails(roster.map((r) => r.id), CONCURRENCY);
  const orgs = await fetchOrgLabels(details.values(), CONCURRENCY);
  log(`open data: ${details.size} records, ${orgs.size} committees and parties`);
  const slugs = uniqueSlugs(roster);
  const meps = roster.map((r) => toMep(r, details.get(r.id)!, orgs, slugs.get(r.id)!));
  const mepsFile = MepsFileSchema.parse({ generatedAt: now, source: 'European Parliament open data API (data.europarl.europa.eu)', meps });

  // 2. Bluesky candidates: name search, EP-listed profiles, own-domain handles, approved overrides
  const candidates = new Map<string, Map<string, Candidate>>(); // mepId → did → candidate
  const extraDids = new Map<string, Set<string>>(); // mepId → DIDs we know but have no profile for yet
  const resolvedRefs = new Map<string, string[]>();
  const addExtra = (mepId: string, did: string) => extraDids.set(mepId, (extraDids.get(mepId) ?? new Set()).add(did));

  await mapLimit(meps, CONCURRENCY, async (mep) => {
    const found = new Map((await searchActors(`${mep.givenName} ${mep.familyName}`)).map((c) => [c.did, c]));
    candidates.set(mep.id, found);
    const refs: string[] = [];
    for (const ref of blueskyRefsFromHomepages(mep.homepages)) {
      const did = ref.startsWith('did:') ? ref : await resolveHandle(ref);
      if (did) { refs.push(did); addExtra(mep.id, did); }
    }
    for (const domain of ownDomains(mep.homepages)) {
      const did = await resolveHandle(domain);
      if (did) addExtra(mep.id, did);
    }
    resolvedRefs.set(mep.id, refs);
  });
  for (const o of overrides.approve) addExtra(o.mepId, o.did);

  const extraProfiles = await getProfiles([...new Set([...extraDids.values()].flatMap((s) => [...s]))]);
  for (const [mepId, dids] of extraDids) {
    for (const did of dids) {
      const p = extraProfiles.get(did);
      if (p) candidates.get(mepId)?.set(did, p);
    }
  }

  // 3. Classify, then fetch full profiles for anything confirmable
  const byId = new Map(meps.map((m) => [m.id, m]));
  const verdicts = [...candidates].flatMap(([mepId, cands]) => {
    const identity = identityOf(byId.get(mepId)!, resolvedRefs.get(mepId) ?? []);
    return [...cands.values()].map((c) => ({ mepId, candidate: c, verdict: classify(identity, c, overrides) }));
  });
  const profiles: Map<string, Profile> = await getProfiles([...new Set(verdicts.filter((v) => v.verdict.status !== 'none').map((v) => v.candidate.did))]);
  const scored: Scored[] = verdicts
    .filter((v) => v.verdict.status !== 'none' && profiles.has(v.candidate.did))
    .map((v) => ({ mepId: v.mepId, did: v.candidate.did, verdict: v.verdict, followers: profiles.get(v.candidate.did)!.followers }));
  const { confirmed, review } = resolveMatches(scored);

  const atmosphere: AtmosphereFile = AtmosphereFileSchema.parse({
    generatedAt: now,
    links: confirmed
      .map((s) => {
        const p = profiles.get(s.did)!;
        return {
          mepId: s.mepId, did: s.did, handle: p.handle, displayName: p.displayName || undefined, avatar: p.avatar,
          followers: p.followers, posts: p.posts, verifiedByBluesky: p.verified, method: s.verdict.method!,
        };
      })
      .sort((a, b) => Number(a.mepId) - Number(b.mepId)),
  });
  const reviewFile = ReviewFileSchema.parse({
    generatedAt: now,
    items: review
      .map((s) => {
        const p = profiles.get(s.did)!;
        return { mepId: s.mepId, mepName: byId.get(s.mepId)!.fullName, did: s.did, handle: p.handle, displayName: p.displayName || undefined, reasons: s.verdict.reasons };
      })
      .sort((a, b) => Number(a.mepId) - Number(b.mepId) || a.did.localeCompare(b.did)),
  });

  // 4. Compare confirmed links with what is published, then write everything
  const previous = AtmosphereFileSchema.safeParse(await readJson('atmosphere.json', null));
  const key = (l: { mepId: string; did: string }) => `${l.mepId}:${l.did}`;
  const before = new Set(previous.success ? previous.data.links.map(key) : []);
  const after = new Set(atmosphere.links.map(key));
  const added = [...after].filter((k) => !before.has(k));
  const removed = [...before].filter((k) => !after.has(k));
  const confirmedChanged = added.length > 0 || removed.length > 0;

  const wrote = {
    meps: await writeIfChanged('meps.json', mepsFile),
    atmosphere: await writeIfChanged('atmosphere.json', atmosphere),
    review: await writeIfChanged('review-queue.json', reviewFile),
  };
  if (!(await readJson('overrides.json', null))) await writeFile(new URL('overrides.json', DATA), `${JSON.stringify(overrides, null, 2)}\n`);

  const byMethod = Object.groupBy(atmosphere.links, (l) => l.method);
  log(`confirmed: ${atmosphere.links.length} (${Object.entries(byMethod).map(([k, v]) => `${k} ${v!.length}`).join(', ')}); review: ${reviewFile.items.length}`);
  log(`confirmed links added: ${added.length}, removed: ${removed.length}; files written: ${JSON.stringify(wrote)}`);
  console.log(`confirmed-changed=${confirmedChanged}`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `confirmed-changed=${confirmedChanged}\nadded=${added.length}\nremoved=${removed.length}\n`);
  }
}

main().catch((err) => {
  console.error('[sync] FAILED, nothing written:', err);
  process.exit(1);
});
