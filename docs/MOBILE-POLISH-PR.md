## What

> **Historical checkpoint.** This record preserves the decisions, terminology, screenshots and verification status at that stage. Pending/local-only release statements and old commands are not current deployment instructions. Use the [documentation index](README.md), [current publishing guide](EDITORIAL-PUBLISHING.md) and [reconciled audit](DOCUMENTATION-AUDIT-2026-11-12.md) for current context.

Improve Windows on 390 × 844 and 360 × 800 screens: safe-area-aware content and world controls, readable navigation, single-column DISPATCH cards, more directory spacing, clearer carousel controls and DISPATCH results in global search. Dark-only styling, existing fonts, WebGL discovery and profile-before-world flow are preserved.

## Why

The mobile archive squeezed two editions into narrow columns, controls had small targets, and search omitted daily editions. This directly implements the owner's mobile polish brief; no separate issue was needed.

## Review evidence

[Full mobile report and before/after screenshot table](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/MOBILE-POLISH-2026-11-12.md)

| Page, 390 × 844 | Before | After |
| --- | --- | --- |
| Homepage | ![Before](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/before-home-390.png?raw=true) | ![After](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/after-home-390.png?raw=true) |
| About | ![Before](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/before-about-390.png?raw=true) | ![After](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/after-about-390.png?raw=true) |
| DISPATCH | ![Before](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/before-dispatch-390.png?raw=true) | ![After](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/after-dispatch-390.png?raw=true) |
| Directory | ![Before](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/before-directory-390.png?raw=true) | ![After](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/mobile-polish/docs/review/mobile-polish/after-directory-390.png?raw=true) |

These are responsive Chrome captures. Physical iOS Safari toolbar, virtual keyboard and lower-powered-device checks remain outstanding; see the report checklist. The optional handwriting experiment was not attempted. Historical plates/content are unchanged.

## Validation and limitations

`npm run verify` passed: lint, typecheck and all 196 tests (28 files), including 10 new search/gesture/entry/empty-state regression cases. Client and SSR builds passed. Full `npm run build` reached postbuild but failed resolving `registry.npmjs.org` for `npx tsx`; rerun the complete build in CI/a network-enabled terminal. The pre-existing large-entry-chunk warning remains (607.17 kB, 177.08 kB gzip). No new dependencies or deployment changes.

## Checklist

- [x] Linked issue or documented why no issue was needed
- [x] `npm run verify` passes
- [ ] `npm run build` clean — client/SSR pass; SEO postbuild needs network-enabled rerun
- [x] Added tests for new behavior or explained why tests were not practical
- [x] Updated docs when public behavior, API contracts, or operations changed
- [x] No new `any` types introduced
- [x] Tested in browser locally
- [ ] Physical iOS Safari toolbar/touch/keyboard review before release
