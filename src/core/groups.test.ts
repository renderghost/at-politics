import { describe, expect, it } from 'vitest';
import { groupFromCode, GROUPS } from './groups';

describe('groupFromCode (EP open data api:political-group)', () => {
  it.each([
    ['PPE', 'EPP'], ['S&D', 'S&D'], ['PfE', 'PfE'], ['ECR', 'ECR'], ['Renew', 'Renew'],
    ['Verts/ALE', 'Greens/EFA'], ['The Left', 'The Left'], ['ESN', 'ESN'], ['NI', 'NI'],
  ])('maps %s to %s', (code, short) => {
    expect(groupFromCode(code)).toBe(short);
  });
  it('throws on an unknown code, so a new group is noticed rather than mislabelled', () => {
    expect(() => groupFromCode('XYZ')).toThrow(/Unknown political group/);
  });
  it('defines nine groups, each with a full name', () => {
    expect(GROUPS).toHaveLength(9);
    for (const g of GROUPS) expect(g.label.length).toBeGreaterThan(10);
  });
});
