import { describe, expect, it } from 'vitest';
import { AtmosphereLinkSchema, MepSchema, OverridesSchema } from './schema';

const validMep = {
  id: '256810', slug: 'mika-aaltola', fullName: 'Mika AALTOLA', givenName: 'Mika', familyName: 'Aaltola',
  country: 'Finland', group: 'EPP', groupLabel: "Group of the European People's Party (Christian Democrats)",
  nationalParty: 'Kansallinen Kokoomus', photo: 'https://www.europarl.europa.eu/mepphoto/256810.jpg',
  email: 'mika.aaltola@europarl.europa.eu', homepages: ['https://www.mikaaaltola.eu/'],
  accounts: [{ kind: 'x', url: 'https://x.com/MikaAaltola' }],
  committees: [{ code: 'AFET', name: 'Foreign Affairs', role: 'member' }],
  epProfile: 'https://www.europarl.europa.eu/meps/en/256810',
};

describe('schemas', () => {
  it('accepts a valid MEP', () => {
    expect(MepSchema.parse(validMep)).toEqual(validMep);
  });
  it('rejects an unknown member state or group', () => {
    expect(MepSchema.safeParse({ ...validMep, country: 'Norway' }).success).toBe(false);
    expect(MepSchema.safeParse({ ...validMep, group: 'XYZ' }).success).toBe(false);
  });
  it('rejects a link without a DID', () => {
    const link = { mepId: '1', did: 'alice.bsky.social', handle: 'alice.bsky.social', followers: 1, posts: 1, verifiedByBluesky: false, method: 'domain' };
    expect(AtmosphereLinkSchema.safeParse(link).success).toBe(false);
    expect(AtmosphereLinkSchema.safeParse({ ...link, did: 'did:plc:abc123' }).success).toBe(true);
  });
  it('accepts empty overrides', () => {
    expect(OverridesSchema.parse({ approve: [], reject: [] })).toEqual({ approve: [], reject: [] });
  });
});
