# Handwritten header signature: production fix

> **Historical checkpoint.** This record preserves the decisions, terminology, screenshots and verification status at that stage. Pending/local-only release statements and old commands are not current deployment instructions. Use the [documentation index](README.md), [current publishing guide](EDITORIAL-PUBLISHING.md) and [reconciled audit](DOCUMENTATION-AUDIT-2026-11-12.md) for current context.

## Release alignment checked

On November 11, 2026 (Montréal), GitHub main and local main were at
`0f38193` (merged PR #53), with successful GitHub checks. The merged tree
matches the final mobile branch commit `b627bf3`. Production loaded
`/assets/index-B1_iTue7.js`, matching the existing local release build.
The handwritten asset was present and downloaded successfully in production.

## Cause and fix

The server renders the fallback text with `data-loaded="false"`. An SVG can
finish loading before React hydrates the page and attaches its load handler.
Production inspection showed `complete=true`, `naturalWidth=300`, but
`data-loaded="false"` and image opacity `0`. This hid the handwriting even
though the correct asset and release were deployed.

Navigation now checks `complete` and `naturalWidth` when its image ref attaches,
as well as retaining the existing load/error handlers. No typography or layout
has been redesigned. The accessible text and failed-image fallback remain.

## Validation

- Lint and TypeScript passed through `npm run verify`.
- All 203 tests across 29 files passed on the final run.
- Added real server-render/hydrate tests for an already-loaded image and an
  already-failed image, without dispatching a new load event.
- The first full suite run, alongside the build, timed out on an existing
  story-search navigation assertion. A full rerun passed without test changes.
- Client and SSR bundles built successfully. SEO postbuild requires npm
  registry access, unavailable in the agent shell; the release command must
  complete the full build in the user's terminal before upload.
- Local browser: signature `data-loaded=true`, opacity `1`.

Before (production):

![Fallback text on production](review/signature-fix/header-before-production.png)

After (local fix):

![Handwritten signature visible locally](review/signature-fix/header-after.png)

## Release handoff

The fix is committed locally on main. Shell DNS access to GitHub is unavailable,
so pushing and production upload must run in the user's terminal. After the
push, build the same clean main commit and upload to Cloudflare Pages project
`catalogue`, branch `production`, with that commit hash. Do not report this fix
as live until production is checked after that upload.
