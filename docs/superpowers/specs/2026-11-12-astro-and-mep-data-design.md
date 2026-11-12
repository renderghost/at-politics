# Rostrum — Astro foundation and MEP data design

Status: approved in chat · 2026-11-12 · revised during PR B (roster source, EP-listed rule, domain guards)

## 1. Intent

Turn the speculative landing page into a small, portable web app that uses the European Parliament's MEP roster as the basis for features:

- draft profiles for every MEP, ready before they onboard;
- discovery of MEPs already on Bluesky and other Atmosphere apps;
- real "MEPs already on the open social web" widgets on the homepage.

Deploy to Vercel first, without locking in: the host and, as far as practical, the framework must stay replaceable.

## 2. Findings that shape the design (probed 2026-11-12)

- **Roster:** `https://www.europarl.europa.eu/meps/en/full-list/xml` returns 720 MEPs, but only to browser-like clients: scripts get a CloudFront bot challenge (403, or 202 with an empty body). **Revised during PR B:** the sync uses the open data API's `meps/show-current` instead. It lists the same 720 ids (verified), with group codes (`PPE`, `Verts/ALE`, …) and ISO country codes (`GR` for Greece). National party names come from `corporate-bodies/{id}` `prefLabel`.
- **Detail:** `https://data.europarl.europa.eu/api/v2/meps/{id}?format=application/ld+json` adds `givenName`, `familyName`, `img` (EP photo URL), `hasEmail`, `homepage` (string or list), `account[]` (typed social links) and `hasMembership[]` (committees as org ids).
- **No browser CORS** on either EP source, so data must be fetched ahead of time, not in the browser.
- **EP social-account fields list no Bluesky accounts** (X 433, Instagram 426, Facebook 355+62, LinkedIn 122, YouTube 82, blog 8, Telegram 6, Mastodon 3, Bluesky 0). **However, 18 MEPs list a `bsky.app/profile/…` URL as their homepage**, which is the strongest signal available (added as rule (a) below).
- **Bluesky public API** (`public.api.bsky.app`) allows CORS and needs no auth. A name-search spike scored about 170 strong candidates, but with false positives (Manfred Weber → Lauren Weber; López Aguilar → Rep. Pete Aguilar).
- Many MEPs carry Bluesky's own verification (issuer `bsky.app`). The EP's account (`europarl.europa.eu`) is not a trusted verifier and publishes no MEP lists or starter packs.

## 3. Framework decision

**Astro + TypeScript, static output.**

- Static HTML by default; 720 profile pages generated at build time; JavaScript only for interactive islands.
- `.astro` is an HTML superset, so the existing page ports almost unchanged.
- Host-portable: plain static output today; server routes later via a swappable adapter (Vercel first, Node, Netlify, Cloudflare or an EU host later). No adapter until a server route is needed.
- Next.js was rejected because its strongest features (ISR, image optimisation, middleware) are tied to Vercel's infrastructure, which is the lock-in the user wants to avoid.

### Portability rules

1. Domain logic (schemas, normalisation, slugs, matching) lives in `src/core/` as plain TypeScript with no Astro or Vercel imports, and is unit-tested.
2. The data sync runs in GitHub Actions, not on host-specific cron.
3. Data is versioned JSON in `data/`.
4. No host-proprietary storage or APIs. Future server code uses standard `Request`/`Response`.

## 4. Repository layout

```
src/core/        schemas (zod), normalisation, slugs, matching rules (+ *.test.ts)
src/components/  Astro components for page sections
src/layouts/     base layout (head, banner, header, footer)
src/pages/       routes: /, /meps/, /meps/[slug]/
src/scripts/     client-side TypeScript islands (handle preview, forms, hemicycle, search)
src/styles/      global.css (design tokens and styles)
scripts/sync/    nightly sync (EP roster → EP open data → Bluesky matching)
data/            meps.json · atmosphere.json · review-queue.json · overrides.json
tests/e2e/       Playwright smoke tests
```

## 5. Matching rules (Bluesky ↔ MEP)

Store the account's DID, not its handle (handles change).

- **Confirmed** (public) if any of:
  - (a) the EP lists the account (`bsky.app/profile/<handle-or-did>` homepage, resolved to its DID so later handle changes still match);
  - (a2) the account's handle equals one of the MEP's own homepage domains **and** the name matches. Shared hosts (`bsky.app`, `linktr.ee`, social networks, blog platforms, `europa.eu`) never count. Without this guard, `bsky.app` homepages would have "confirmed" Bluesky's own account for 18 MEPs;
  - (b) Bluesky `verifiedStatus: valid` **and** the display name contains both the normalised given and family name **and** (the bio contains an MEP keyword in any EU language **or** the handle stem matches the EP-listed X username);
  - (c) a manual approval in `data/overrides.json`.
  - Precedence when an MEP has several: override > EP-listed > domain > verified, then followers. A DID confirmed for two MEPs is published for neither and goes to review.
- **Likely** (review queue only, never public): a name match plus a keyword or X-username match, without (a) to (c).
- **Rejected:** recorded in `overrides.json` and never suggested again.
- Unit tests use real fixtures, including the known false positives.

## 6. Nightly sync (GitHub Action)

1. Fetch the roster, then the 720 detail records (about 4 concurrent requests), then Bluesky search and profiles.
2. Validate everything against zod schemas; write `data/*.json`.
3. Roster and stat changes are committed directly to `main` (`data/` only).
4. If the set of **confirmed** DIDs changes, push to the single bot branch `data/atmosphere-links` and open a PR if none is open, instead of committing (human approval for new public links).
5. On any source failure or schema failure, commit nothing and fail the job visibly.

## 7. Pages and features

- **`/`**: the current landing page, plus a section "MEPs already on the open social web". It shows the count (N of 720), a breakdown by political group and country, and 12 cards chosen round-robin across political groups (cross-party by construction). It also shows "Updated <date>" and a link to the directory.
- **`/meps/`**: a directory of all 720, with search and filters by country, group and "on the Atmosphere".
- **`/meps/[slug]/`**: a draft Rostrum profile. It shows the EP photo (credited "© European Union – EP"), country, group, national party, committees (where resolvable), EP links, the confirmed Bluesky account and the proposed `@first-last.rostrum.eu` handle. The call to action is "Is this you? Claim this profile", which opens the reserve form prefilled.
- **Reserve form:** autocompletes from the 720 names; prefills name, member state, handle and official email.

## 8. Framing and ethics

- MEPs shown are "on Bluesky and the open social web today, not Rostrum users and not endorsing it".
- Profiles are labelled: "Built from European Parliament open data. Not created or endorsed by this Member."
- The site-wide speculative-concept banner remains.
- Only public data is used; EP photos are credited.

## 9. Quality

- Vitest unit tests for `src/core/`.
- Data validated by zod at build time (a bad dataset fails the build).
- `astro check` for types.
- Playwright smoke tests for the key pages and flows.
- GitHub Actions CI on pull requests and on `main`.

## 10. Delivery

- **PR A — Astro port.** The same page with no visual change; components, layout, TypeScript islands, `src/core/slug.ts` with tests, CI and smoke test. Vercel-ready (auto-detected Astro, static output).
- **PR B — MEP data.** Sync pipeline, data files, homepage widgets, directory, draft profiles and the find-yourself reserve flow.

## 11. Later (out of scope)

Real form submission (server route), AT Protocol OAuth sign-in, 24-language i18n, per-MEP Open Graph images.
