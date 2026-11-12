import { describe, expect, it } from 'vitest';
import { currentOrg, parseCurrentMeps, toMep, type EpDetail, type OrgLabels } from './ep';
import { MepSchema } from './schema';

// Shape of https://data.europarl.europa.eu/api/v2/meps/show-current (trimmed real records).
const CURRENT = {
  data: [
    { identifier: '256810', label: 'Mika AALTOLA', givenName: 'Mika', familyName: 'Aaltola', 'api:country-of-representation': 'FI', 'api:political-group': 'PPE' },
    { identifier: '257073', label: 'Tobiasz BOCHEŃSKI', givenName: 'Tobiasz', familyName: 'Bocheński', 'api:country-of-representation': 'PL', 'api:political-group': 'ECR' },
  ],
};

describe('parseCurrentMeps', () => {
  it('maps codes to names and keeps the EP spelling', () => {
    expect(parseCurrentMeps(CURRENT)).toEqual([
      { id: '256810', fullName: 'Mika AALTOLA', givenName: 'Mika', familyName: 'Aaltola', country: 'Finland', group: 'EPP' },
      { id: '257073', fullName: 'Tobiasz BOCHEŃSKI', givenName: 'Tobiasz', familyName: 'Bocheński', country: 'Poland', group: 'ECR' },
    ]);
  });
  it('throws on a record without a numeric id', () => {
    expect(() => parseCurrentMeps({ data: [{ ...CURRENT.data[0]!, identifier: '' }] })).toThrow(/id/);
  });
  it('throws on an empty response', () => {
    expect(() => parseCurrentMeps({ data: [] })).toThrow(/no MEPs/);
  });
});

const membership = (org: string, cls: string, role = 'MEMBER', endDate?: string) => ({
  organization: org, role: `def/ep-roles/${role}`, membershipClassification: `def/ep-entities/${cls}`,
  memberDuring: { startDate: '2024-07-16', ...(endDate ? { endDate } : {}) },
});

const DETAIL: EpDetail = {
  identifier: '256810', givenName: 'Mika', familyName: 'Aaltola', img: 'https://www.europarl.europa.eu/mepphoto/256810.jpg',
  hasEmail: ['mailto:mika.aaltola@europarl.europa.eu', 'mailto:other@example.eu'],
  homepage: 'https://www.mikaaaltola.eu/',
  account: [
    { id: 'https://x.com/MikaAaltola', dcterms_type: 'http://publications.europa.eu/resource/authority/address-type/TWT' },
    { id: 'https://www.instagram.com/maaltola/', dcterms_type: 'http://publications.europa.eu/resource/authority/address-type/IST' },
    { id: 'https://example.eu/feed', dcterms_type: 'http://publications.europa.eu/resource/authority/address-type/ZZZ' },
  ],
  hasMembership: [
    membership('org/6562', 'COMMITTEE_PARLIAMENTARY_STANDING'),
    membership('org/7000', 'COMMITTEE_PARLIAMENTARY_STANDING', 'CHAIR'),
    membership('org/6563', 'COMMITTEE_PARLIAMENTARY_STANDING', 'MEMBER', '2025-01-01'),
    membership('org/1', 'WORKING_GROUP'),
    membership('org/5000', 'NATIONAL_POLITICAL_GROUP', 'MEMBER', '2024-01-01'),
    membership('org/6726', 'NATIONAL_POLITICAL_GROUP'),
  ],
};
// org/6563 is known but its membership has ended, so it must still be excluded.
const ORGS: OrgLabels = new Map([
  ['org/6562', { code: 'AFET', name: 'Foreign Affairs' }],
  ['org/6563', { code: 'DROI', name: 'Human Rights' }],
  ['org/7000', { code: 'INTA', name: 'International Trade' }],
  ['org/5000', { code: 'OLD', name: 'Former Party' }],
  ['org/6726', { code: 'KOK', name: 'Kansallinen Kokoomus' }],
]);

describe('currentOrg', () => {
  it('finds current memberships of a kind, ignoring ended ones', () => {
    expect(currentOrg(DETAIL, 'NATIONAL_POLITICAL_GROUP')).toEqual(['org/6726']);
    expect(currentOrg(DETAIL, 'COMMITTEE_PARLIAMENTARY_STANDING').sort()).toEqual(['org/6562', 'org/7000']);
  });
});

describe('toMep', () => {
  const entry = parseCurrentMeps(CURRENT)[0]!;
  const mep = toMep(entry, DETAIL, ORGS, 'mika-aaltola');

  it('produces a record that passes the schema', () => {
    expect(() => MepSchema.parse(mep)).not.toThrow();
  });
  it('maps identity, group, current national party and contact', () => {
    expect(mep).toMatchObject({
      id: '256810', slug: 'mika-aaltola', fullName: 'Mika AALTOLA', givenName: 'Mika', familyName: 'Aaltola',
      country: 'Finland', group: 'EPP', groupLabel: "Group of the European People's Party (Christian Democrats)",
      nationalParty: 'Kansallinen Kokoomus', email: 'mika.aaltola@europarl.europa.eu',
      homepages: ['https://www.mikaaaltola.eu/'], epProfile: 'https://www.europarl.europa.eu/meps/en/256810',
    });
  });
  it('maps account types, falling back to "other"', () => {
    expect(mep.accounts.map((a) => a.kind)).toEqual(['x', 'instagram', 'other']);
  });
  it('keeps only current standing committees, chairs first', () => {
    expect(mep.committees).toEqual([
      { code: 'INTA', name: 'International Trade', role: 'chair' },
      { code: 'AFET', name: 'Foreign Affairs', role: 'member' },
    ]);
  });
  it('accepts a list of homepages and a missing one', () => {
    expect(toMep(entry, { ...DETAIL, homepage: ['https://a.eu', 'https://b.eu'] }, ORGS, 's').homepages).toEqual(['https://a.eu', 'https://b.eu']);
    expect(toMep(entry, { ...DETAIL, homepage: undefined }, ORGS, 's').homepages).toEqual([]);
  });
});
