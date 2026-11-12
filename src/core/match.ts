/**
 * Matching rules: is this Bluesky account this MEP? Framework-agnostic and pure, so it is unit-tested
 * against real cases. See spec §5. Public pages only ever show `confirmed` matches.
 */
import { slugify } from './slug';

export interface MepIdentity {
  id: string;
  givenName: string;
  familyName: string;
  /** EP-listed homepage URLs. */
  homepages: string[];
  /** EP-listed X/Twitter profile URLs. */
  xHandles: string[];
  /** Bluesky handles or DIDs the EP lists for this MEP (from bsky.app profile URLs, resolved to DIDs where possible). */
  blueskyRefs: string[];
}

export interface Candidate {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  /** Bluesky verification status is "valid". */
  verified: boolean;
}

export interface OverrideEntry { mepId: string; did: string; note?: string }
export interface Overrides { approve: OverrideEntry[]; reject: OverrideEntry[] }

export type Method = 'override' | 'ep-listed' | 'domain' | 'verified';
export type Verdict =
  | { status: 'confirmed'; method: Method; reasons: string[] }
  | { status: 'likely' | 'none'; method?: undefined; reasons: string[] };

/** Words that say "Member of the European Parliament", in EU languages, accent-free and lower-case. */
const KEYWORD_TOKENS = new Set(['mep', 'meps', 'mdep', 'mpe', 'eurodeputado', 'eurodeputada', 'eurodiputado', 'eurodiputada', 'europoslanec', 'europoslankyne', 'europoslankyna', 'europosel', 'europoslanka', 'europarlamentar', 'europarlamentara', 'europarlementarier', 'europaparlamentariker', 'europaparlamentsmedlem', 'europarlamentaarikko', 'europarlamendisaadik', 'eurodeputato', 'eurodeputata', 'europarlamenter', 'europarlamentaras', 'eiroparlamentarietis', 'europaabgeordneter', 'europaabgeordnete', 'eurodepute', 'eurodeputee', 'feisire']);
const KEYWORD_PHRASES = ['european parliament', 'member of the european', 'europaisches parlament', 'europaparlament', 'europarlament', 'parlement europeen', 'depute europeen', 'deputee europeenne', 'parlamento europeo', 'parlamento europeu', 'europees parlement', 'europski parlament', 'evropski parlament', 'europsky parlament', 'evropsky parlament', 'parlament europejski', 'parlamentul european', 'europos parlamento', 'eiropas parlament', 'euroopan parlamentti', 'euroopa parlamendi', 'europa parlamentet', 'europaparlamentet', 'parlamint na heorpa', 'parlament ewropew', 'europai parlament'];

const tokens = (s: string | undefined): string[] => slugify(s ?? '').split('-').filter(Boolean);

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Hosts that serve many people's pages. A homepage on one of these says nothing about who owns the
 * domain, so it can never support the domain rule (e.g. bsky.app would otherwise "confirm" Bluesky itself).
 */
const SHARED_HOSTS = ['bsky.app', 'bsky.social', 'linktr.ee', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'threads.net', 'europarl.europa.eu', 'europa.eu', 'wordpress.com', 'blogspot.com', 'medium.com', 'substack.com', 'about.me', 'carrd.co', 'beacons.ai'];
const isSharedHost = (host: string) => SHARED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));

/** Domains an MEP plausibly owns: their homepage hosts, minus shared platforms. */
export function ownDomains(homepages: string[]): string[] {
  return [...new Set(homepages.map(hostOf).filter((h): h is string => !!h && !isSharedHost(h)))];
}

/** Handles or DIDs from bsky.app profile URLs (any bsky.app subdomain, optional trailing slash). */
export function blueskyRefsFromHomepages(homepages: string[]): string[] {
  const refs: string[] = [];
  for (const url of homepages) {
    let u: URL;
    try { u = new URL(url); } catch { continue; }
    const host = u.hostname.toLowerCase();
    if (host !== 'bsky.app' && !host.endsWith('.bsky.app')) continue;
    const m = /^\/profile\/([^/]+)\/?$/.exec(u.pathname);
    if (m) refs.push(decodeURIComponent(m[1]!).toLowerCase());
  }
  return [...new Set(refs)];
}

function xUsername(url: string): string | null {
  const m = /(?:x|twitter)\.com\/(?:#!\/)?@?([A-Za-z0-9_]{1,15})/i.exec(url);
  return m ? m[1]!.toLowerCase() : null;
}

/** Given name's first token and at least one family-name token both appear in the display name. */
export function nameMatches(mep: Pick<MepIdentity, 'givenName' | 'familyName'>, displayName: string | undefined): boolean {
  const shown = new Set(tokens(displayName));
  const given = tokens(mep.givenName)[0];
  const family = tokens(mep.familyName).filter((t) => t.length >= 2);
  return !!given && shown.has(given) && family.some((t) => shown.has(t));
}

export function hasMepKeyword(...texts: Array<string | undefined>): boolean {
  for (const text of texts) {
    const toks = tokens(text);
    if (toks.some((t) => KEYWORD_TOKENS.has(t))) return true;
    const joined = ` ${toks.join(' ')} `;
    if (KEYWORD_PHRASES.some((p) => joined.includes(` ${p}`))) return true;
  }
  return false;
}

export function classify(mep: MepIdentity, c: Candidate, overrides: Overrides): Verdict {
  const same = (o: OverrideEntry) => o.mepId === mep.id && o.did === c.did;
  if (overrides.reject.some(same)) return { status: 'none', reasons: ['override:reject'] };
  if (overrides.approve.some(same)) return { status: 'confirmed', method: 'override', reasons: ['override:approve'] };

  const handle = c.handle.toLowerCase();
  const reasons: string[] = [];

  const refs = new Set(mep.blueskyRefs.map((r) => r.toLowerCase()));
  if (refs.has(c.did.toLowerCase()) || refs.has(handle)) return { status: 'confirmed', method: 'ep-listed', reasons: ['ep-listed'] };

  const name = nameMatches(mep, c.displayName);
  if (name && ownDomains(mep.homepages).includes(handle)) return { status: 'confirmed', method: 'domain', reasons: ['homepage-domain', 'name'] };

  const keyword = hasMepKeyword(c.description, c.displayName);
  const stem = handle.split('.')[0]!.replace(/[^a-z0-9]/g, '');
  const xMatch = mep.xHandles.map(xUsername).some((x) => !!x && x.replace(/_/g, '') === stem);

  if (name) reasons.push('name');
  if (keyword) reasons.push('keyword');
  if (xMatch) reasons.push('x-handle');
  if (c.verified) reasons.push('bluesky-verified');

  if (c.verified && name && (keyword || xMatch)) return { status: 'confirmed', method: 'verified', reasons };
  if (name && (keyword || xMatch || c.verified)) return { status: 'likely', reasons };
  return { status: 'none', reasons };
}

export interface Scored { mepId: string; did: string; verdict: Verdict; followers: number }

const METHOD_RANK: Record<Method, number> = { override: 0, 'ep-listed': 1, domain: 2, verified: 3 };

/**
 * Reduce all scored candidates to at most one confirmed account per MEP.
 * A DID confirmed for more than one MEP is ambiguous: neither is published; both go to review.
 */
export function resolveMatches(scored: Scored[]): { confirmed: Scored[]; review: Scored[] } {
  const confirmedByMep = new Map<string, Scored>();
  for (const s of scored) {
    if (s.verdict.status !== 'confirmed') continue;
    const current = confirmedByMep.get(s.mepId);
    const rank = (x: Scored) => METHOD_RANK[x.verdict.method!];
    if (!current || rank(s) < rank(current) || (rank(s) === rank(current) && s.followers > current.followers)) {
      confirmedByMep.set(s.mepId, s);
    }
  }

  const mepsPerDid = new Map<string, string[]>();
  for (const s of confirmedByMep.values()) mepsPerDid.set(s.did, [...(mepsPerDid.get(s.did) ?? []), s.mepId]);

  const confirmed: Scored[] = [];
  const review: Scored[] = [];
  for (const s of confirmedByMep.values()) {
    if (mepsPerDid.get(s.did)!.length > 1) review.push({ ...s, verdict: { status: 'likely', reasons: [...s.verdict.reasons, 'ambiguous-did'] } });
    else confirmed.push(s);
  }
  const published = new Set(confirmed.map((s) => s.mepId));
  for (const s of scored) {
    if (s.verdict.status === 'likely' && !published.has(s.mepId)) review.push(s);
  }
  return { confirmed, review };
}
