/**
 * Name normalisation for handles and URLs.
 * Framework-agnostic: no Astro or browser APIs, so it runs in pages, client scripts and the data sync.
 */

const TRANSLITERATIONS: ReadonlyArray<[RegExp, string]> = [
  [/ß/g, 'ss'],
  [/[æÆ]/g, 'ae'],
  [/[øØ]/g, 'o'],
  [/[łŁ]/g, 'l'],
  [/[đĐ]/g, 'd'],
];

/** Turn any name into a lowercase ASCII slug: "Žaneta O'Brien" → "zaneta-obrien". */
export function slugify(input: string): string {
  let s = (input ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [pattern, replacement] of TRANSLITERATIONS) s = s.replace(pattern, replacement);
  return s
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The handle stem for a person, without the domain: ("Ana", "Moreau") → "ana-moreau". */
export function handleFor(first: string, last: string): string {
  return [slugify(first), slugify(last)].filter(Boolean).join('-');
}

export const HANDLE_DOMAIN = 'rostrum.eu';

/** Map EP id → URL slug. Names are used as-is when unique; colliding names get the EP id appended. */
export function uniqueSlugs(people: Array<{ id: string; givenName: string; familyName: string }>): Map<string, string> {
  const base = new Map(people.map((p) => [p.id, handleFor(p.givenName, p.familyName) || p.id]));
  const counts = new Map<string, number>();
  for (const s of base.values()) counts.set(s, (counts.get(s) ?? 0) + 1);
  return new Map([...base].map(([id, s]) => [id, counts.get(s)! > 1 ? `${s}-${id}` : s]));
}
