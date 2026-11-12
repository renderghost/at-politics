import type { Candidate } from '../../src/core/match';
import { fetchJson, HttpError } from './http';

const API = 'https://public.api.bsky.app/xrpc';

interface ActorView {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  followersCount?: number;
  postsCount?: number;
  verification?: { verifiedStatus?: string };
}

export type Profile = Candidate & { avatar?: string; followers: number; posts: number };

const toCandidate = (a: ActorView): Candidate => ({
  did: a.did,
  handle: a.handle,
  displayName: a.displayName,
  description: a.description,
  verified: a.verification?.verifiedStatus === 'valid',
});

export async function searchActors(q: string, limit = 10): Promise<Candidate[]> {
  const body = await fetchJson<{ actors?: ActorView[] }>(`${API}/app.bsky.actor.searchActors?${new URLSearchParams({ q, limit: String(limit) })}`);
  return (body.actors ?? []).map(toCandidate);
}

/** Resolve a domain handle to a DID, or null when the domain is not a Bluesky handle. */
export async function resolveHandle(handle: string): Promise<string | null> {
  try {
    const body = await fetchJson<{ did?: string }>(`${API}/com.atproto.identity.resolveHandle?${new URLSearchParams({ handle })}`, { retries: 2 });
    return body.did ?? null;
  } catch (err) {
    if (err instanceof HttpError && err.status === 400) return null; // "Unable to resolve handle"
    throw err;
  }
}

/** Full profiles (with counts and avatar), 25 per request. Unknown or deleted DIDs are simply absent. */
export async function getProfiles(dids: string[]): Promise<Map<string, Profile>> {
  const out = new Map<string, Profile>();
  for (let i = 0; i < dids.length; i += 25) {
    const params = new URLSearchParams();
    for (const d of dids.slice(i, i + 25)) params.append('actors', d);
    const body = await fetchJson<{ profiles?: ActorView[] }>(`${API}/app.bsky.actor.getProfiles?${params}`);
    for (const p of body.profiles ?? []) {
      out.set(p.did, { ...toCandidate(p), avatar: p.avatar, followers: p.followersCount ?? 0, posts: p.postsCount ?? 0 });
    }
  }
  return out;
}
