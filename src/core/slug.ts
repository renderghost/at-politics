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
