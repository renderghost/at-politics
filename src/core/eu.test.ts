import { describe, expect, it } from 'vitest';
import { countryFromCode, MEMBER_STATES, OFFICIAL_LANGUAGES } from './eu';

describe('EU reference data', () => {
  it('lists 27 unique member states', () => {
    expect(new Set(MEMBER_STATES).size).toBe(27);
  });
  it('lists 24 unique official languages', () => {
    expect(new Set(OFFICIAL_LANGUAGES.map((l) => l.code)).size).toBe(24);
  });
});


describe('countryFromCode (EP open data api:country-of-representation)', () => {
  it('maps every code the API uses, including GR for Greece', () => {
    const codes = 'AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK'.split(' ');
    expect(new Set(codes.map(countryFromCode)).size).toBe(27);
    expect(countryFromCode('GR')).toBe('Greece');
    expect(countryFromCode('CZ')).toBe('Czechia');
  });
  it('throws on an unknown code', () => {
    expect(() => countryFromCode('NO')).toThrow(/Unknown member state/);
  });
});
