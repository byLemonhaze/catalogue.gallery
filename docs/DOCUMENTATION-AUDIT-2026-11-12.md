# Documentation reconciliation — 12 November 2026

## Scope and approval

The owner identified stale Content Lab / Claude Haiku documentation, confirmed external Grok bots and Sanity as today's editorial workflow, requested an audit before changes, and approved the reconciliation. Additional portfolio feedback requested visual evidence directly in the README.

Baseline: local clean `main` at `cb9354d0854a3fc8c5b1997cd1c54ba2bbd22b0f` (PR #59), after `95c93df` (Stories/Constellation, PR #57). Work is on `docs/current-publishing-guide`. This pass changes documentation only: no app behavior, CMS records, external bots, credentials, workflows or production settings.

## Findings and resolution

| Finding | Resolution |
|---|---|
| README framed the old in-repo generation/research UI as current and required Grok/Haiku keys | Replace with external bots → Sanity overview and dedicated publishing guide; preserve legacy contracts separately |
| Public Blog URLs and Content Lab naming survived in active instructions | Use Stories and canonical `/stories/`; document `/blog/` only as compatibility redirects or retained stored values |
| Architecture called model APIs current and claimed only fullscreen routes embed sites | Describe external production, profile preview plus world embedding, and current navigation/Counterpoint |
| Production Sanity origin reads and browser CDN reads were conflated | Explain SSR snapshot, origin API, browser fallback, cache window and reload behavior |
| New-edition appearance was liable to be interpreted as an automatic deployment or live push | Document request-time availability without redeploy; no continuous polling in open tabs |
| Story and Dispatch publication timing differed | Explicitly document that Stories lack the Dispatch future-date filter; keep scheduled Stories as drafts |
| Dispatch contract assumed a three-minute wait and verified 7:03 AM schedule | Use the actual five-minute HTML cache window; mark external scheduling and ledger configuration unverified |
| Historical Sanity unpublish can restore a bundled edition | Retain archive provenance/backfill policy and make retraction limitation prominent |
| Normal onboarding exposed an overwriting legacy article migration | Move it to legacy maintenance guidance; `createOrReplace` can replace CMS edits |
| API and deployment docs mixed active site dependencies with old editor requirements | Separate legacy endpoint contracts/keys/migration from public reading and application/review requirements |
| Old test counts and pending release checkpoints looked current | Replace fixed README counts, label historical reports and preserve original evidence |
| README undersold visual design | Embed real desktop/mobile Stories captures and the Counterpoint/Windows checkpoint with an honest pre-rename caption |
| MCP proposal read like an operational plan | Label it as an unimplemented proposal and link current architecture |
| Docs lacked an authoritative entry point | Add an index separating current guides, legacy, proposals, session history and visual evidence |

## Source evidence inspected

- `src/App.tsx`: public routes, aliases and retained private editor.
- `functions/_lib/publicContent.ts`: origin reads, Story eligibility, projection and ordering.
- `functions/_lib/renderPublic.ts`, `src/lib/publicPageData.tsx`, `src/hooks/useArticles.ts`, `src/hooks/useDispatches.ts`, `src/sanity/client.ts`: server snapshot, browser fallback and no ongoing Dispatch polling.
- `src/lib/dispatch.ts`, `functions/dispatch/[slug].ts`, `functions/_middleware.ts`, `functions/sitemap.xml.ts`: published-date filtering, archive merge, request-time routing/cache, sitemap and host handling.
- `studio/schemas/post.ts`, `studio/schemas/dispatch.ts`, `studio/schemas/homepageEditorial.ts`: fields and editorial selection.
- `functions/api/content-*.ts`, `src/lib/contentLab/byok.ts`, `.github/workflows/content-generate.yml`, `migrations/003_content_drafts.sql`: retained editor, exact provider calls and manual workflow.
- `scripts/migrate-articles.ts`: old import's overwrite semantics.
- `package.json`, CI, release scripts and git history: verification/release expectations.

## Release evidence available locally

The local `v0.2.0` tag points to baseline `cb9354d`. The existing ignored `dist/production-smoke.json` records 2026-11-12T07:29:42.967Z, expected asset `/assets/index-Bn5iY_j1.js`, and no failures. The existing generated release notes record that source SHA and verification at 07:29:44Z, with full build/share audits and smoke checks passed before publication.

These are preserved local artifacts from the preceding release, **not fresh verification of GitHub's published-release state or Cloudflare's current deployment**. This docs pass does not move the tag or repeat the fixed-version release script. Use [Releasing](RELEASING.md) for subsequent changes.

## Remaining evidence and decisions

1. External bot repository/config, schedule/timezone, approval gate, retry ledger and a verified site-first X publication remain outside this audit. Owner-confirmed usage is distinct from verified automation.
2. Legacy editor code is still present. Removing documentation's active-workflow claims does not disable its routes or revoke keys. Decide retirement in a separate code/security review.
3. Historical Dispatch fallback remains. Confirm full backfill and retraction requirements before removing it.
4. README now has actual screenshots. A new motion GIF/video and refreshed homepage capture after the Stories rename remain portfolio follow-ups. Older images are explicitly captioned as checkpoints.
5. Existing device/performance limitations still apply: viewport evidence does not certify iOS toolbar behavior or lower-powered GPU performance. No new device benchmark was performed.

## Verification for this pass

- `npm run verify`: passed lint, typecheck and **225 tests across 33 files** on 12 November 2026. The test environment emitted its existing unsupported document-navigation notice; all tests passed.
- Local documentation check: **34 Markdown files, 262 relative links/image references, zero missing files or heading targets**. External URLs were not validated in the DNS-restricted shell.
- `git diff --check`: passed. All tracked changes are Markdown; historical record bodies remain intact after their new context banners.
- `npm run build`: client and SSR compilation passed, with the existing 612.48 kB client chunk warning. The full build **failed** in postbuild because npm could not resolve `registry.npmjs.org` for `tsx`. SEO generation and share audits were not completed in this run; do not deploy this incomplete output.
- `git ls-remote --heads origin main`: failed at 2026-11-12T07:54Z because `github.com` could not resolve. Remote branch/release status cannot be inferred from cached local refs.

The preceding release artifacts described above were read before this build attempt regenerated `dist`; their recorded results are historical, not the result of this docs pass. Publication of the documentation branch still requires a network-enabled terminal, PR checks and protected-main merge. No production deployment was performed.
