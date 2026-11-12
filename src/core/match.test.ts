import { describe, expect, it } from 'vitest';
import { blueskyRefsFromHomepages, classify, resolveMatches, type Candidate, type MepIdentity } from './match';

const NO_OVERRIDES = { approve: [], reject: [] };

const mep = (over: Partial<MepIdentity> = {}): MepIdentity => ({
  id: '1', givenName: 'Erik', familyName: 'Marquardt', homepages: [], xHandles: [], blueskyRefs: [], ...over,
});
const cand = (over: Partial<Candidate> = {}): Candidate => ({
  did: 'did:plc:aaa', handle: 'someone.bsky.social', displayName: '', description: '', verified: false, ...over,
});

describe('classify: confirmed', () => {
  it('confirms a handle equal to an EP-listed homepage domain', () => {
    const v = classify(
      mep({ homepages: ['https://www.erik-marquardt.eu/'] }),
      cand({ handle: 'erik-marquardt.eu', displayName: 'Erik Marquardt' }),
      NO_OVERRIDES,
    );
    expect(v).toMatchObject({ status: 'confirmed', method: 'domain' });
  });

  it('confirms Bluesky-verified + both names + an MEP keyword (Lukas Sieper)', () => {
    const v = classify(
      mep({ givenName: 'Lukas', familyName: 'Sieper' }),
      cand({ handle: 'lukassiepermdep.bsky.social', displayName: 'Lukas Sieper, MdEP', verified: true }),
      NO_OVERRIDES,
    );
    expect(v).toMatchObject({ status: 'confirmed', method: 'verified' });
  });

  it('confirms Bluesky-verified + both names + EP-listed X username', () => {
    const v = classify(
      mep({ givenName: 'Anja', familyName: 'Hazekamp', xHandles: ['https://x.com/AnjaHazekamp'] }),
      cand({ handle: 'anjahazekamp.bsky.social', displayName: 'Anja Hazekamp', verified: true }),
      NO_OVERRIDES,
    );
    expect(v).toMatchObject({ status: 'confirmed', method: 'verified' });
  });

  it('matches names regardless of accents and case (Leïla Chaibi)', () => {
    const v = classify(
      mep({ givenName: 'Leila', familyName: 'Chaibi' }),
      cand({ displayName: 'Leïla Chaibi', description: 'Députée européenne', verified: true }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('confirmed');
  });

  it('confirms a manual approval', () => {
    const v = classify(mep(), cand({ did: 'did:plc:ok' }), { approve: [{ mepId: '1', did: 'did:plc:ok' }], reject: [] });
    expect(v).toMatchObject({ status: 'confirmed', method: 'override' });
  });
});

describe('Bluesky profiles listed by the European Parliament', () => {
  it('extracts handles and DIDs from bsky.app profile URLs in any of the observed forms', () => {
    expect(blueskyRefsFromHomepages([
      'https://bsky.app/profile/saramatthieu.bsky.social',
      'https://bsky.app/profile/estrellagalan.bsky.social/',
      'https://web-cdn.bsky.app/profile/rudikennes.bsky.social',
      'https://bsky.app/profile/did:plc:zjtyybjelg2zihdpoifkffet',
      'https://bsky.app/profile/MariaOhisalo.Vihreat.fi',
      'https://www.konecna.cz',
      'https://linktr.ee/franciscoassis.deputado',
    ])).toEqual([
      'saramatthieu.bsky.social', 'estrellagalan.bsky.social', 'rudikennes.bsky.social',
      'did:plc:zjtyybjelg2zihdpoifkffet', 'mariaohisalo.vihreat.fi',
    ]);
  });

  it('confirms the account the EP lists, by handle or by DID', () => {
    const listed = mep({ givenName: 'Sara', familyName: 'Matthieu', blueskyRefs: ['saramatthieu.bsky.social', 'did:plc:sara'] });
    expect(classify(listed, cand({ handle: 'saramatthieu.bsky.social' }), NO_OVERRIDES)).toMatchObject({ status: 'confirmed', method: 'ep-listed' });
    expect(classify(listed, cand({ did: 'did:plc:sara', handle: 'renamed.bsky.social' }), NO_OVERRIDES)).toMatchObject({ status: 'confirmed', method: 'ep-listed' });
  });
});

describe('domain rule guards (bugs caught before shipping)', () => {
  it('never treats a bsky.app profile URL as the MEP owning the domain bsky.app', () => {
    const v = classify(
      mep({ givenName: 'Sara', familyName: 'Matthieu', homepages: ['https://bsky.app/profile/saramatthieu.bsky.social'] }),
      cand({ did: 'did:plc:bluesky', handle: 'bsky.app', displayName: 'Bluesky', verified: true }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('none');
  });

  it('never treats a link-in-bio platform as the MEP own domain', () => {
    const v = classify(
      mep({ givenName: 'Francisco', familyName: 'Assis', homepages: ['https://linktr.ee/franciscoassis.deputado'] }),
      cand({ handle: 'linktr.ee', displayName: 'Linktree' }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('none');
  });

  it('requires the name to match for a domain handle', () => {
    const v = classify(
      mep({ homepages: ['https://party-campaign.eu'] }),
      cand({ handle: 'party-campaign.eu', displayName: 'Our Party' }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('none');
  });
});

describe('classify: likely (review queue only)', () => {
  it('keeps unverified name + X username match out of public view (Łukasz Kohut)', () => {
    const v = classify(
      mep({ givenName: 'Łukasz', familyName: 'Kohut', xHandles: ['https://x.com/LukaszKohut'] }),
      cand({ handle: 'lukaszkohut.bsky.social', displayName: 'Łukasz KOHUT🇪🇺' }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('likely');
  });

  it('does not confirm verified + name without a keyword or X match', () => {
    const v = classify(mep(), cand({ displayName: 'Erik Marquardt', verified: true }), NO_OVERRIDES);
    expect(v.status).toBe('likely');
  });
});

describe('classify: rejected false positives from the 2026-11-12 probe', () => {
  it('rejects Manfred Weber vs verified "Lauren Weber"', () => {
    const v = classify(
      mep({ givenName: 'Manfred', familyName: 'Weber' }),
      cand({ handle: 'laurenweberhp.bsky.social', displayName: 'Lauren Weber', verified: true }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('none');
  });

  it('rejects Juan Fernando López Aguilar vs "Rep. Pete Aguilar"', () => {
    const v = classify(
      mep({ givenName: 'Juan Fernando', familyName: 'López Aguilar' }),
      cand({ handle: 'aguilar.house.gov', displayName: 'Rep. Pete Aguilar', verified: true, description: 'Member of Congress' }),
      NO_OVERRIDES,
    );
    expect(v.status).toBe('none');
  });

  it('honours a manual rejection even when rules would confirm', () => {
    const v = classify(
      mep({ homepages: ['https://erik-marquardt.eu'] }),
      cand({ did: 'did:plc:no', handle: 'erik-marquardt.eu' }),
      { approve: [], reject: [{ mepId: '1', did: 'did:plc:no' }] },
    );
    expect(v.status).toBe('none');
  });

  it('does not treat "mep" inside another word as a keyword', () => {
    const v = classify(mep(), cand({ displayName: 'Erik Marquardt', description: 'Mephisto fan', verified: true }), NO_OVERRIDES);
    expect(v.status).toBe('likely');
  });
});

describe('resolveMatches', () => {
  const confirmed = (mepId: string, did: string, method: 'domain' | 'verified' | 'override' | 'ep-listed', followers = 0) => ({
    mepId, did, verdict: { status: 'confirmed' as const, method, reasons: [] }, followers,
  });

  it('prefers the account the EP lists over a domain or verified match', () => {
    const out = resolveMatches([confirmed('1', 'did:plc:a', 'domain', 900), confirmed('1', 'did:plc:b', 'ep-listed', 1)]);
    expect(out.confirmed).toEqual([expect.objectContaining({ did: 'did:plc:b' })]);
  });

  it('keeps one confirmed account per MEP, preferring override, then domain, then followers', () => {
    const out = resolveMatches([
      confirmed('1', 'did:plc:a', 'verified', 900),
      confirmed('1', 'did:plc:b', 'domain', 10),
    ]);
    expect(out.confirmed).toEqual([expect.objectContaining({ mepId: '1', did: 'did:plc:b' })]);
  });

  it('sends a DID confirmed for two MEPs to review instead of publishing either', () => {
    const out = resolveMatches([confirmed('1', 'did:plc:x', 'verified'), confirmed('2', 'did:plc:x', 'verified')]);
    expect(out.confirmed).toEqual([]);
    expect(out.review.map((r) => r.mepId).sort()).toEqual(['1', '2']);
  });

  it('puts likely matches in review, never in confirmed', () => {
    const out = resolveMatches([{ mepId: '3', did: 'did:plc:l', verdict: { status: 'likely', reasons: ['name'] }, followers: 5 }]);
    expect(out.confirmed).toEqual([]);
    expect(out.review).toHaveLength(1);
  });

  it('drops likely matches for an MEP who already has a confirmed account', () => {
    const out = resolveMatches([
      confirmed('1', 'did:plc:a', 'domain'),
      { mepId: '1', did: 'did:plc:z', verdict: { status: 'likely', reasons: [] }, followers: 1 },
    ]);
    expect(out.review).toEqual([]);
  });
});
