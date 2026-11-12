import { describe, expect, it } from 'vitest';
import { MEMBER_STATES, OFFICIAL_LANGUAGES } from './eu';

describe('EU reference data', () => {
  it('lists 27 unique member states', () => {
    expect(new Set(MEMBER_STATES).size).toBe(27);
  });
  it('lists 24 unique official languages', () => {
    expect(new Set(OFFICIAL_LANGUAGES.map((l) => l.code)).size).toBe(24);
  });
});
