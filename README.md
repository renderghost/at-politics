# Rostrum

A speculative website for **Rostrum**: a verified home on the open social web (AT Protocol) for Europe's elected representatives, proposed to run on Eurosky as a Modal Foundation project.

> Speculative design concept. Not affiliated with or endorsed by the Modal Foundation, Eurosky or the European Parliament.

## Stack

[Astro](https://astro.build) with TypeScript and static output. The build is plain HTML, CSS and JS that any host can serve. No host adapter is installed yet; add one (for example `@astrojs/vercel`) only when a server route is needed.

```
src/core/        framework-agnostic logic (slugs, EU reference data), unit-tested
src/components/  page sections
src/layouts/     base layout: head, concept banner, header, footer
src/pages/       routes
src/scripts/     client-side TypeScript (handle preview, forms, hemicycle)
src/styles/      global.css: design tokens and styles
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

CI runs all of the above on every pull request and on `main`.

## Deploy

**Vercel:** import the repository. Vercel detects Astro automatically: the build command is `npm run build` and the output directory is `dist`. No configuration file is needed.

**Anywhere else:** run `npm run build` and serve `dist/` as static files.

## Design docs

- `docs/superpowers/specs/2026-11-11-rostrum-landing-page-design.md`: landing page
- `docs/superpowers/specs/2026-11-12-astro-and-mep-data-design.md`: Astro foundation and MEP data
