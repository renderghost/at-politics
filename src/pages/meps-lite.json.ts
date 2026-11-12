import type { APIRoute } from 'astro';
import { meps } from '../data';

/** Minimal roster for the reserve form's "find yourself" search. Generated statically at build time. */
export interface MepLite { id: string; givenName: string; familyName: string; country: string; group: string; email?: string }

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(meps.map(({ id, givenName, familyName, country, group, email }): MepLite => ({ id, givenName, familyName, country, group, email }))),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
