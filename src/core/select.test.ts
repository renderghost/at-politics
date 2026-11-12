import { describe, expect, it } from 'vitest';
import { pickCrossParty } from './select';

const item = (id: string, group: string, followers: number) => ({ id, group, followers });

describe('pickCrossParty', () => {
  it('takes one per group in turn before taking a second from any group', () => {
    const picked = pickCrossParty([
      item('a1', 'A', 100), item('a2', 'A', 90), item('a3', 'A', 80),
      item('b1', 'B', 5), item('c1', 'C', 1),
    ], 4);
    expect(picked.map((p) => p.id)).toEqual(['a1', 'b1', 'c1', 'a2']);
  });

  it('orders within a group by followers and groups alphabetically', () => {
    const picked = pickCrossParty([item('z', 'Z', 1), item('b-low', 'B', 1), item('b-high', 'B', 50)], 3);
    expect(picked.map((p) => p.id)).toEqual(['b-high', 'z', 'b-low']);
  });

  it('returns everything when there are fewer than n', () => {
    expect(pickCrossParty([item('a', 'A', 1)], 12)).toHaveLength(1);
  });
});
