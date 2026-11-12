# PR B — MEP data, Atmosphere discovery, directory and draft profiles: implementation plan

Spec: `docs/superpowers/specs/2026-11-12-astro-and-mep-data-design.md` §5–§8, §10 (PR B)

**Goal:** real European Parliament data drives the site:
- a nightly sync finds MEPs on Bluesky under strict rules;
- the homepage shows "MEPs already on the open social web";
- every MEP has a directory entry and a draft Rostrum profile;
- the reserve form finds you by name.

**Done when:**
- `npm run sync` writes valid `data/*.json` from live sources;
- unit tests cover every matching rule with the real false positives;
- the build generates the homepage, `/meps/` and 720 profile pages;
- e2e tests cover the widget, directory filter, a profile and the claim → reserve prefill;
- the nightly workflow commits data or opens a PR when confirmed links change;
- CI is green.

## Data sources (probed 2026-11-12)

- **Roster:** `GET https://www.europarl.europa.eu/meps/en/full-list/xml` with `Accept: application/xml`. Returns 720 × {fullName, country, politicalGroup, id, nationalPoliticalGroup}.
- **Detail:** `GET https://data.europarl.europa.eu/api/v2/meps/{id}?format=application/ld+json`. Returns givenName, familyName (title case), img, hasEmail (`mailto:`), homepage (string | string[]), account[] (typed URL), hasMembership[]. A current membership has no `memberDuring.endDate`.
- **Committee label:** `GET https://data.europarl.europa.eu/api/v2/corporate-bodies/{orgId}?format=application/ld+json` gives `label` (e.g. AFET) and `altLabel.en` (e.g. Foreign Affairs). Fetch once per unique org.
- **Bluesky:** `public.api.bsky.app` (no auth, CORS):
  - `app.bsky.actor.searchActors` (includes description and verification);
  - `com.atproto.identity.resolveHandle` (domain handles);
  - `app.bsky.actor.getProfiles` (≤25 per call; followers, posts, avatar).

## Steps

1. **Dependencies.** Add zod 4.6.7 (same as Astro's) and tsx 4.23.15 (to run the sync script). Add the scripts `sync`, `sync:check`.
2. **`src/core/groups.ts`, test first.** Map the 9 EP group labels to short names (EPP, S&D, PfE, ECR, Renew, Greens/EFA, The Left, ESN, NI). An unknown label fails loudly.
3. **`src/core/schema.ts`.** Zod schemas for `Mep`, `MepsFile`, `AtmosphereLink`, `AtmosphereFile`, `ReviewItem`, `ReviewFile` and `Overrides`. Inferred types are exported.
4. **`src/core/match.ts`, test first.** `classify(mep, candidate, overrides)` returns `confirmed | likely | none`, with reasons.
   - Rules as in spec §5. Store the DID.
   - Fixtures cover:
     - domain handle → confirmed;
     - verified + both names + keyword → confirmed;
     - verified + name but no keyword or X match → likely, not confirmed;
     - unverified + name + X handle → likely;
     - Manfred Weber vs "Lauren Weber" (verified) → none;
     - López Aguilar vs "Rep. Pete Aguilar" → none;
     - override approve → confirmed;
     - override reject → none.
5. **`src/core/select.ts`, test first.** `pickCrossParty(links, n)`: round-robin across groups, ordered by followers within each group.
6. **`src/core/slug.ts`.** Add `uniqueSlugs(meps)`: name slug, with the EP id appended only on a collision. Test first.
7. **`scripts/sync/`.**
   - `http.ts`: fetch with timeout, retries and backoff, a concurrency limiter and a generic User-Agent.
   - `ep.ts`: roster, detail and committee labels.
   - `bluesky.ts`: search, resolveHandle, getProfiles.
   - `index.ts`: orchestrate, validate with zod, write `data/` only if everything succeeded. Print a summary and `confirmed-changed=true|false` (written to `$GITHUB_OUTPUT` when set).
8. **Run the sync live.** Commit `data/meps.json`, `data/atmosphere.json`, `data/review-queue.json` and an empty `data/overrides.json`. Inspect the confirmed list by hand for mismatches.
9. **`src/data.ts`.** Load and validate the data files at build time (bad data fails the build).
10. **Homepage widget** (`AtmosphereNow.astro`), placed after the open-web section:
    - the count N of 720;
    - bars by political group and the top countries;
    - 12 cross-party cards (avatar, name, group, country, handle, followers, link to the Bluesky profile);
    - "Updated" date and a link to `/meps/`;
    - the framing disclaimer.
11. **`/meps/` directory.** All 720 rendered statically, with search, a country filter, a group filter and an "On the Atmosphere" toggle (client-side filter over data attributes). Photos lazy-load.
12. **`/meps/[slug]/` draft profile.**
    - EP photo (credited), name, group, country, national party, committees, official links and EP profile link;
    - the confirmed Bluesky account (if any);
    - the proposed handle;
    - a "Claim this profile" link to `/?mep={id}#reserve`;
    - the disclaimer.
13. **Find-yourself reserve form.**
    - A name field with a native `<datalist>` from `/meps-lite.json`, a static endpoint generated at build.
    - Picking a name, or arriving with `?mep=`, prefills the first and last name, member state and EP email, and shows "We found you: {name}, {group}".
14. **Nightly workflow** (`.github/workflows/sync.yml`, 03:17 UTC, plus manual dispatch):
    - run the sync and fail on error;
    - if confirmed links changed, open a PR on branch `data/sync-<date>`;
    - otherwise commit `data/` to `main` if anything changed.
15. **E2E tests.** Widget count equals the data; the directory shows 720 and filtering narrows it; a profile has its disclaimer and claim link; the claim link prefills the reserve form; there are no console errors on new pages.
16. **Verify.** check, test, build and e2e (CI mode) with exit codes. Then screenshots of the new sections at desktop and mobile widths.
17. **Ship.** Docs (README: data and sync), check the PR state, push and open the PR. Subscribe to it.
