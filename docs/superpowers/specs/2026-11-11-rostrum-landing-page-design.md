# Rostrum — speculative landing page (v1) design

Status: draft for review · 2026-11-11

## 1. Intent

A speculative landing page that persuades **elected EU politicians** (MEPs at launch) and their offices to **reserve a verified Rostrum handle** ahead of a spring 2027 founding cohort. It also tests the proposition: which promises resonate with career politicians who are both self-interested and public-minded.

Success for v1: a credible, polished page whose copy speaks to real political motivations, with two working calls to action (front-end only), ready to show to stakeholders.

## 2. What Rostrum is (speculative)

- An AT Protocol ("Atmosphere") account and identity service for **authentic, elected representatives only**, modelled on Aster ID (aster.place).
- **A Modal Foundation project, running on Eurosky infrastructure**: PDS hosted in Germany (Hetzner), under GDPR/DSA, contract held by Stichting Modal (NL).
- **Own brand, endorsed** by "Runs on Eurosky · a Modal Foundation project". It must **never** look like an official EU or European Parliament product. A disclaimer appears in the footer and FAQ.
- **Free to every MEP, strictly cross-party**, non-profit, no ads, no data sales.
- Eligibility: **MEPs first** (720, verified against the EP public register), then national, regional and local in later phases.
- Handle format: `@firstname-lastname.rostrum.eu`. The domain itself is the proof of verification.
- Launch status: **"Founding cohort opens spring 2027."**

## 3. Audience and voice

- Dual reader: **the MEP** (hero, promises, emotive, status) and **their office** (a dedicated section on delegation, workload, audit and compliance).
- Motivations addressed, framed positively:
  1. **Legitimacy**: proof it is really you, accountability.
  2. **Control**: no owner's algorithm or policy between you and voters.
  3. **Owned relationship**: your audience is political capital you keep.
  4. **Visible impact**: shape the agenda and show your record.
- Incumbent platforms are addressed **implicitly but pointedly** ("No owner can throttle, sell or switch off your voice"). No brand names, no comparison table.
- British English throughout.

## 4. Page structure

1. **Header**: wordmark, nav (How it works · For your office · Trust · FAQ), language stub (EN ▾ "24 languages at launch"), "Reserve your handle" button.
2. **Hero**
   - H1: **Your mandate. Your voice. Yours to keep.**
   - Sub-line: verified-only space for Europe's elected representatives; a direct line to citizens; part of the open social web; yours to take anywhere.
   - Primary CTA: **Reserve your verified handle**. Inline handle-builder (first and last name → live preview `@ana-moreau.rostrum.eu`).
   - Secondary CTA: **Request a briefing for your office**.
   - Visual: an **illustrative sample profile card** for a fictional MEP, clearly labelled "Illustrative profile". It shows the badge, handle, group-neutral details, a live poll and a record snippet.
3. **Stats strip** (factual context): 720 MEPs · 27 member states · 24 official languages · ~450m citizens · hosted in the EU.
4. **Keep the reach, gain the ownership** (new requirement, 11 Nov). Rostrum is a service *for them*, built on the open social web: everything they value on the big platforms is kept, and the Atmosphere's benefits are added on top. Two lists:
   - *What you keep*: real-time public conversation (posts, threads, replies, quotes, video, DMs); an audience already there (millions of people and journalists on Bluesky and other Atmosphere apps, from day one); familiar apps on every phone (Rostrum is the account, not another app to learn); cross-posting to the networks you still use, plus an open bridge to Mastodon and the fediverse; embeds in websites, newsletters and press; search, trending and discovery; bring your followers (migrate an existing Bluesky account intact, find people you already follow).
   - *What you gain*: an account you own and can move; no owner's algorithm deciding who sees you; verification against the Parliament's register; moderation you choose; EU jurisdiction; a complete, exportable record.
   - Echoed in the hero sub-line and in the FAQ ("Will I lose reach?", "Do I have to leave the platforms I use now?").
5. **The problem** (positive framing): three short statements on impersonation and deepfakes, rented audiences, and borders and languages.
6. **Four pillars**, each with its features:
   - **Legitimacy**: verified handle and badge (EP register), anti-impersonation and deepfake protection, transparency labels (AI-generated, paid promotion, affiliation).
   - **Ownership**: portable EU-hosted account (migrate in or out, keep followers), personal website / profile page, works across every Atmosphere app.
   - **Direct line**: constituent inbox and Q&A, polls and consultations, petitions, live town halls / AMAs, multilingual by default (24 languages).
   - **Influence**: topic hubs on EU files, press room / media connect, legislative record integration (EP open data), insights and analytics (privacy-preserving, no ads).
7. **Citizen trust** (how participation stays credible): tiered results; open to all, with responses from citizens verified through the **EU Digital Identity Wallet** shown separately. Privacy-preserving attribute proofs ("resident in DE"), not identity disclosure. Polls and petitions are labelled as **not** official EP instruments, with pathways to the Committee on Petitions (PETI) and the European Citizens' Initiative.
8. **For your office**: team delegation with roles, drafts and approvals, scheduling, audit trail of who posted what, moderation tools for replies, and an export of everything at any time.
9. **How verification works**: three steps. (1) Reserve handle → (2) verify against the EP register plus an official EP email confirmation → (3) badge issued and labeller applied network-wide.
10. **Trust and neutrality**: non-profit, free, cross-party, no ads, no data sales, EU jurisdiction, open protocol, Modal Foundation governance.
11. **Founding cohort** band: spring 2027, with the primary CTA repeated.
12. **FAQ** (about 8 questions): Is this an official EU service? Is it free? Can I leave and take my followers? What about my existing Bluesky account? Who verifies? Can my staff post? What about national/regional politicians? How are citizens verified?
13. **Footer**: "Runs on Eurosky · a Modal Foundation project", speculative-concept disclaimer (also a slim banner at the top of the page: not affiliated with or endorsed by Modal, Eurosky or the European Parliament), privacy/terms stubs.

## 5. Calls to action (front-end only)

- **Reserve handle** form: first name, last name, EP email, member state (select), consent checkbox. Live handle preview. On submit: client-side validation, then a success state ("Handle held: @… — we'll verify via your EP email"). No network request.
- **Briefing request** form: name, role (MEP / Chief of staff / Adviser / Comms), office email, message (optional). On submit: success state. No network request.
- Both forms are accessible: labels, error messages linked via `aria-describedby`, focus management to the success message.

## 6. Visual design

- **Institutional-editorial**: serif display (e.g. Fraunces or Source Serif) with a clean sans for body (e.g. Inter); generous whitespace; deep ink (#0F1B2D-ish) on warm paper; one civic accent (deep cobalt/ultramarine nodding to Europe, not EU flag yellow-on-blue pastiche); fine rules, small caps labels, broadsheet-like grid.
- Light and dark themes via CSS custom properties.
- Responsive down to 360px; no horizontal scroll.
- Accessibility target: WCAG 2.1 AA (contrast, focus states, keyboard, reduced motion).

## 7. Build

- A single self-contained `site/index.html` (inline CSS and JS). No build step.
- Google Fonts only as an external dependency.
- Verification: open in headless Chromium at mobile and desktop widths, screenshot, check for console errors, tab through both forms.
- Deliver: commit and push to `claude/kind-fermi-piadtc`; publish a private artifact preview.

## 8. Out of scope (v1)

Backend or storage for sign-ups, real translations, analytics, real EP data integration, logo design beyond a typographic wordmark.

## 9. Open questions for v2

- Domain availability (`rostrum.eu`) and trademark check.
- Whether candidates are ever admitted.
- Governance: how Modal / an advisory board ensures cross-party neutrality.
