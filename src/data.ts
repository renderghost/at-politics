/**
 * Build-time access to data/*.json. Everything is validated here, so malformed data fails the build
 * instead of reaching a page.
 */
import mepsJson from '../data/meps.json';
import atmosphereJson from '../data/atmosphere.json';
import { GROUPS, type GroupShort } from './core/groups';
import { AtmosphereFileSchema, MepsFileSchema, type AtmosphereLink, type Mep } from './core/schema';

export const mepsFile = MepsFileSchema.parse(mepsJson);
export const atmosphereFile = AtmosphereFileSchema.parse(atmosphereJson);

export const meps: Mep[] = mepsFile.meps;
export const mepById = new Map(meps.map((m) => [m.id, m]));
export const linkByMep = new Map<string, AtmosphereLink>(atmosphereFile.links.map((l) => [l.mepId, l]));

for (const l of atmosphereFile.links) {
  if (!mepById.has(l.mepId)) throw new Error(`atmosphere.json links unknown MEP ${l.mepId}`);
}

export interface OnAtmosphere { mep: Mep; link: AtmosphereLink }
export const onAtmosphere: OnAtmosphere[] = atmosphereFile.links.map((link) => ({ mep: mepById.get(link.mepId)!, link }));

export const byGroup: Array<{ group: GroupShort; label: string; total: number; online: number }> = GROUPS.map((g) => ({
  group: g.short,
  label: g.label,
  total: meps.filter((m) => m.group === g.short).length,
  online: onAtmosphere.filter((o) => o.mep.group === g.short).length,
})).sort((a, b) => b.total - a.total);

export const atmosphereStats = {
  total: meps.length,
  online: onAtmosphere.length,
  ownDomain: onAtmosphere.filter((o) => !/\.(bsky|eurosky)\.social$/.test(o.link.handle)).length,
  onEurosky: onAtmosphere.filter((o) => o.link.handle.endsWith('.eurosky.social')).length,
  countries: new Set(onAtmosphere.map((o) => o.mep.country)).size,
  updated: atmosphereFile.generatedAt,
};

export const bskyProfileUrl = (handle: string) => `https://bsky.app/profile/${handle}`;
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
export const formatCount = (n: number) => new Intl.NumberFormat('en-GB', { notation: n >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
