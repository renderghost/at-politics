# Rostrum

A speculative website for **Rostrum**: a verified home on the open social web (AT Protocol) for Europe's elected representatives, proposed to run on Eurosky as a Modal Foundation project.

> Speculative design concept. Not affiliated with or endorsed by the Modal Foundation, Eurosky or the European Parliament.

## Stack

[Astro](https://astro.build) with TypeScript and static output. The build is plain HTML, CSS and JS that any host can serve. No host adapter is installed yet; add one (for example `@astrojs/vercel`) only when a server route is needed.

```
src/core/        framework-agnostic logic: EP mapping, matching rules, schemas, slugs (unit-tested)
src/data.ts      loads and validates data/*.json at build time
src/components/  page sections
src/layouts/     base layout: head, concept banner, header, footer
src/pages/       routes: /, /meps/, /meps/[slug]/ (720 draft profiles), /meps-lite.json
src/scripts/     client-side TypeScript (handle preview, forms, hemicycle)
src/styles/      global.css: design tokens and styles
scripts/sync/    nightly data sync (EP open data → Bluesky matching → data/)
data/            synced data, committed to git
tests/e2e/       Playwright smoke tests
docs/superpowers specs and implementation plans
```

## Develop

Requires Node 22.23.4 or later (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:4321
npm run check      # type-check
npm test           # unit tests (Vitest)
npm run build      # static site in dist/
npm run test:e2e   # Playwright smoke tests against the build (run build first)
```

npm run sync       # refresh data/ from live sources (about 6 minutes)
```

CI runs check, test, build and e2e on every pull request and on `main`.

## MEP data

`npm run sync` (and the nightly **Sync MEP data** workflow) builds `data/` from:

- **European Parliament open data API** (`data.europarl.europa.eu`): the 720 current MEPs, their photo, email, homepages, social accounts, committees and national party. The `www.europarl.europa.eu` XML list is not used because it sits behind a bot challenge.
- **Bluesky public API** (`public.api.bsky.app`): name search, handle resolution and profiles.

| File | Contents |
|---|---|
| `data/meps.json` | Every current MEP, validated against `src/core/schema.ts` |
| `data/atmosphere.json` | **Confirmed** MEP ↔ Atmosphere accounts. Only these appear on the site |
| `data/review-queue.json` | Likely matches awaiting a human decision. Never shown on the site |
| `data/overrides.json` | Manual decisions: `approve` or `reject` an `{ mepId, did }` pair |

An account is **confirmed** only when one of these holds (see `src/core/match.ts`):

1. The European Parliament lists it (a `bsky.app/profile/…` homepage).
2. Its handle is the MEP's own web domain and the name matches. Shared hosts such as `bsky.app` or `linktr.ee` never count.
3. Bluesky has verified it, both names match, and its bio says MEP (in any EU language) or its handle matches the MEP's EP-listed X username.
4. It is approved in `data/overrides.json`.

The nightly workflow commits roster and statistics changes to `main`. When the set of confirmed links changes, it opens (or refreshes) one pull request from `data/atmosphere-links` instead, so a person approves every new public link. Repository settings must allow GitHub Actions to create pull requests. Pull requests opened by the workflow's token do not trigger CI by themselves.

## Deploy

**Vercel:** import the repository. Vercel detects Astro automatically: the build command is `npm run build` and the output directory is `dist`. No configuration file is needed.

**Anywhere else:** run `npm run build` and serve `dist/` as static files.

## Design docs

- `docs/superpowers/specs/2026-11-11-rostrum-landing-page-design.md`: landing page
- `docs/superpowers/specs/2026-11-12-astro-and-mep-data-design.md`: Astro foundation and MEP data
- `docs/superpowers/plans/`: implementation plans for each pull request
