/** Typed element lookup that fails loudly in development but never throws in production. */
export function byId<T extends HTMLElement>(id: string, type: new () => T): T | null {
  const el = document.getElementById(id);
  return el instanceof type ? el : null;
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
