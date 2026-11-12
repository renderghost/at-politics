/** Choose items round-robin across groups (alphabetical), highest followers first within each group. */
export function pickCrossParty<T extends { group: string; followers: number }>(items: T[], n: number): T[] {
  const byGroup = new Map<string, T[]>();
  for (const it of items) byGroup.set(it.group, [...(byGroup.get(it.group) ?? []), it]);
  const queues = [...byGroup.keys()].sort().map((g) => byGroup.get(g)!.sort((a, b) => b.followers - a.followers));
  const out: T[] = [];
  for (let round = 0; out.length < n && queues.some((q) => q.length > round); round++) {
    for (const q of queues) {
      if (out.length === n) break;
      if (q[round]) out.push(q[round]!);
    }
  }
  return out;
}
