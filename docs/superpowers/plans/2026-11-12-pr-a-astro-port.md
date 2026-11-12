# PR A — Astro port: implementation plan

Spec: `docs/superpowers/specs/2026-11-12-astro-and-mep-data-design.md` §10 (PR A)

**Goal:** the same landing page, rebuilt on Astro + TypeScript, with no visual change, plus the test, type-check and CI foundation that PR B builds on.

**Done when:**
- `npm run build` outputs static `dist/`.
- `npm test` and `npm run check` pass.
- The Playwright smoke test passes.
- A screenshot of the built page matches the current page.
- CI runs on the PR.

## Steps

1. **Baseline.** Screenshot the current root `index.html` at 1366px and 390px (light and dark) for comparison.
2. **Scaffold.** Add:
   - `package.json`, with pinned versions: astro 7.4, TypeScript, vitest, `@astrojs/check`, zod, and `@playwright/test` 1.63.0 to match the preinstalled browser;
   - `astro.config.mjs` (static, no adapter);
   - `tsconfig.json` (Astro strict);
   - `.gitignore` additions (`.astro/`).
3. **Core, test first.** Write `src/core/slug.test.ts` (diacritics, apostrophes, ß/æ/ø/ł/đ, hyphens, empty input), watch it fail, then implement `src/core/slug.ts`.
4. **Styles.** Move `styles.css` to `src/styles/global.css` unchanged.
5. **Layout.** `src/layouts/Base.astro` holds the head (meta, fonts, title, description), concept banner, header, footer and a slot.
6. **Components.** Split `index.html` into section components with markup unchanged:
   - `Hero` (with handle builder and profile card)
   - `Chamber`
   - `OpenWeb`
   - `Problems`
   - `Pillars`
   - `CitizenTrust`
   - `Office`
   - `Verification`
   - `Commitments`
   - `Reserve` (both forms)
   - `Faq`

   The member-state list moves to a typed constant rendered server-side.
7. **Scripts.** Move `main.js` into TypeScript modules:
   - `src/scripts/handle.ts` (uses `core/slug`)
   - `src/scripts/forms.ts`
   - `src/scripts/hemicycle.ts`

   Each is loaded by its component.
8. **Page.** `src/pages/index.astro` composes the layout and components. Delete the root `index.html`, `styles.css` and `main.js`.
9. **Smoke test.** `tests/e2e/smoke.spec.ts` checks:
   - the page renders with no console errors;
   - 720 seats are drawn;
   - the handle preview updates;
   - reserve form validation shows errors and then success;
   - there is no horizontal overflow at 390px.
10. **CI.** `.github/workflows/ci.yml` runs on pull requests and on `main`: `npm ci`, check, test, build and Playwright (install chromium).
11. **Verify.** Run build, check, test and e2e. Compare screenshots with the baseline.
12. **Docs.** Update the README with dev commands and Vercel notes.
13. **Ship.** Check the PR state, push the branch and open the PR.
