import { describe, expect, it } from 'vitest';
import { slugify, handleFor } from './slug';

describe('slugify', () => {
  it('lower-cases and hyphenates', () => {
    expect(slugify('Ana Moreau')).toBe('ana-moreau');
  });
  it('strips diacritics', () => {
    expect(slugify('Žaneta Nováková')).toBe('zaneta-novakova');
    expect(slugify('Maravillas ABADÍA JOVER')).toBe('maravillas-abadia-jover');
  });
  it('transliterates letters that do not decompose', () => {
    expect(slugify('Strauß')).toBe('strauss');
    expect(slugify('Æsa Øster')).toBe('aesa-oster');
    expect(slugify('Łukasz KOHUT')).toBe('lukasz-kohut');
    expect(slugify('Đuro')).toBe('duro');
  });
  it('drops apostrophes instead of splitting on them', () => {
    expect(slugify("O'Brien")).toBe('obrien');
    expect(slugify('D’Amato')).toBe('damato');
  });
  it('collapses punctuation and trims hyphens', () => {
    expect(slugify('  Jan-Christoph   OETJEN! ')).toBe('jan-christoph-oetjen');
    expect(slugify('Abir AL-SAHLANI')).toBe('abir-al-sahlani');
  });
  it('returns an empty string for empty or symbol-only input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('—!?')).toBe('');
  });
});

describe('handleFor', () => {
  it('joins first and last name', () => {
    expect(handleFor('Ana', 'Moreau')).toBe('ana-moreau');
  });
  it('omits a missing part', () => {
    expect(handleFor('', 'Moreau')).toBe('moreau');
    expect(handleFor('Ana', '  ')).toBe('ana');
  });
  it('returns an empty string when both parts are empty', () => {
    expect(handleFor('', '')).toBe('');
  });
});
