/**
 * Shapes of the files in data/. The sync validates before writing and the site validates before
 * building, so malformed data can never reach a public page. Framework-agnostic.
 */
import { z } from 'zod';
import { MEMBER_STATES } from './eu';
import { GROUP_SHORTS } from './groups';

const did = z.string().regex(/^did:(plc|web):[a-zA-Z0-9._:%-]+$/);
const epId = z.string().regex(/^\d+$/);
const isoDate = z.iso.datetime();

export const ACCOUNT_KINDS = ['x', 'instagram', 'facebook', 'linkedin', 'youtube', 'blog', 'telegram', 'mastodon', 'other'] as const;
export const COMMITTEE_ROLES = ['chair', 'vice-chair', 'member', 'substitute'] as const;

export const MepSchema = z.object({
  id: epId,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  fullName: z.string().min(1),
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  country: z.enum(MEMBER_STATES),
  group: z.enum(GROUP_SHORTS),
  groupLabel: z.string().min(1),
  nationalParty: z.string(),
  photo: z.url(),
  email: z.email().optional(),
  homepages: z.array(z.url()),
  accounts: z.array(z.object({ kind: z.enum(ACCOUNT_KINDS), url: z.url() })),
  committees: z.array(z.object({ code: z.string().min(1), name: z.string().min(1), role: z.enum(COMMITTEE_ROLES) })),
  epProfile: z.url(),
});

export const MepsFileSchema = z.object({
  generatedAt: isoDate,
  source: z.string(),
  meps: z.array(MepSchema).min(1),
});

export const AtmosphereLinkSchema = z.object({
  mepId: epId,
  did,
  handle: z.string().min(1),
  displayName: z.string().optional(),
  avatar: z.url().optional(),
  followers: z.number().int().nonnegative(),
  posts: z.number().int().nonnegative(),
  verifiedByBluesky: z.boolean(),
  method: z.enum(['override', 'ep-listed', 'domain', 'verified']),
});

export const AtmosphereFileSchema = z.object({
  generatedAt: isoDate,
  links: z.array(AtmosphereLinkSchema),
});

export const ReviewItemSchema = z.object({
  mepId: epId,
  mepName: z.string(),
  did,
  handle: z.string(),
  displayName: z.string().optional(),
  reasons: z.array(z.string()),
});

export const ReviewFileSchema = z.object({
  generatedAt: isoDate,
  items: z.array(ReviewItemSchema),
});

const OverrideEntrySchema = z.object({ mepId: epId, did, note: z.string().optional() });
export const OverridesSchema = z.object({
  approve: z.array(OverrideEntrySchema),
  reject: z.array(OverrideEntrySchema),
});

export type Mep = z.infer<typeof MepSchema>;
export type MepsFile = z.infer<typeof MepsFileSchema>;
export type AtmosphereLink = z.infer<typeof AtmosphereLinkSchema>;
export type AtmosphereFile = z.infer<typeof AtmosphereFileSchema>;
export type ReviewFile = z.infer<typeof ReviewFileSchema>;
export type Overrides = z.infer<typeof OverridesSchema>;
