/**
 * Mapping from the European Parliament open data API to our Mep record. Pure and framework-agnostic.
 * List:   https://data.europarl.europa.eu/api/v2/meps/show-current
 * Detail: https://data.europarl.europa.eu/api/v2/meps/{id}
 * Orgs:   https://data.europarl.europa.eu/api/v2/corporate-bodies/{id}  (committees, national parties)
 * (The www.europarl.europa.eu XML list sits behind a bot challenge; the open data API is meant for machines.)
 */
import { countryFromCode, type MemberState } from './eu';
import { groupFromCode, groupLabel, type GroupShort } from './groups';
import type { Mep } from './schema';

export interface CurrentMep { id: string; fullName: string; givenName: string; familyName: string; country: MemberState; group: GroupShort }

interface CurrentMepRecord {
  identifier: string;
  label: string;
  givenName?: string;
  familyName?: string;
  'api:country-of-representation': string;
  'api:political-group': string;
}

export interface EpDetail {
  identifier: string;
  givenName?: string;
  familyName?: string;
  img?: string;
  hasEmail?: string | string[];
  homepage?: string | string[];
  account?: Array<{ id: string; dcterms_type?: string }>;
  hasMembership?: Array<{
    organization?: string;
    role?: string;
    membershipClassification?: string;
    memberDuring?: { startDate?: string; endDate?: string };
  }>;
}

/** Org id (e.g. "org/6562") → its code and display name. */
export type OrgLabels = Map<string, { code: string; name: string }>;

export function parseCurrentMeps(body: { data?: CurrentMepRecord[] }): CurrentMep[] {
  const rows = body.data ?? [];
  if (rows.length === 0) throw new Error('Open data returned no MEPs');
  return rows.map((r) => {
    if (!/^\d+$/.test(r.identifier ?? '')) throw new Error(`MEP record without a valid id: ${r.label}`);
    const [first, ...rest] = r.label.split(' ');
    return {
      id: r.identifier,
      fullName: r.label,
      givenName: r.givenName?.trim() || first!,
      familyName: r.familyName?.trim() || rest.join(' '),
      country: countryFromCode(r['api:country-of-representation']),
      group: groupFromCode(r['api:political-group']),
    };
  });
}

const ACCOUNT_KIND: Record<string, Mep['accounts'][number]['kind']> = {
  TWT: 'x', IST: 'instagram', FBW: 'facebook', FBP: 'facebook', LNK: 'linkedin', YTB: 'youtube', BLG: 'blog', TLG: 'telegram', MST: 'mastodon',
};
const ROLE: Record<string, Mep['committees'][number]['role']> = { CHAIR: 'chair', CHAIR_VICE: 'vice-chair', MEMBER: 'member', MEMBER_SUBSTITUTE: 'substitute' };
const ROLE_ORDER = ['chair', 'vice-chair', 'member', 'substitute'];

const list = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const last = (uri = '') => uri.slice(uri.lastIndexOf('/') + 1);

const current = (detail: EpDetail, kind: string) =>
  list(detail.hasMembership).filter((m) => last(m.membershipClassification) === kind && !m.memberDuring?.endDate && m.organization);

/** Org ids of current memberships of one kind, e.g. COMMITTEE_PARLIAMENTARY_STANDING or NATIONAL_POLITICAL_GROUP. */
export function currentOrg(detail: EpDetail, kind: string): string[] {
  return current(detail, kind).map((m) => m.organization!);
}

export function toMep(entry: CurrentMep, detail: EpDetail, orgs: OrgLabels, slug: string): Mep {
  const party = currentOrg(detail, 'NATIONAL_POLITICAL_GROUP').map((o) => orgs.get(o)?.name).find(Boolean) ?? '';
  const email = list(detail.hasEmail).map((e) => e.replace(/^mailto:/i, '')).find((e) => e.includes('@'));
  return {
    id: entry.id,
    slug,
    fullName: entry.fullName,
    givenName: entry.givenName,
    familyName: entry.familyName,
    country: entry.country,
    group: entry.group,
    groupLabel: groupLabel(entry.group),
    nationalParty: party,
    photo: detail.img || `https://www.europarl.europa.eu/mepphoto/${entry.id}.jpg`,
    ...(email ? { email } : {}),
    homepages: list(detail.homepage),
    accounts: list(detail.account).map((a) => ({ kind: ACCOUNT_KIND[last(a.dcterms_type)] ?? 'other', url: a.id })),
    committees: current(detail, 'COMMITTEE_PARLIAMENTARY_STANDING')
      .filter((m) => orgs.has(m.organization!))
      .map((m) => ({ ...orgs.get(m.organization!)!, role: ROLE[last(m.role)] ?? 'member' }))
      .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.code.localeCompare(b.code)),
    epProfile: `https://www.europarl.europa.eu/meps/en/${entry.id}`,
  };
}
