## What

> **Historical checkpoint.** This record preserves the decisions, terminology, screenshots and verification status at that stage. Pending/local-only release statements and old commands are not current deployment instructions. Use the [documentation index](README.md), [current publishing guide](EDITORIAL-PUBLISHING.md) and [reconciled audit](DOCUMENTATION-AUDIT-2026-11-12.md) for current context.

Replace the homepage's repeated grey Dispatch bulletin with the approved Counterpoint treatment: one vertical title, neutral counter and background, lilac word reveals, and a compact read-edition link. Remove the duplicate static index during animation and the repeated “independent” in the supporting introduction.

## Why

The owner reviewed twelve local concepts, tried the blue News Reel, then chose Counterpoint after requesting colour in the text only and a shorter, quieter sidebar. This is a directly requested design iteration; no separate issue was needed.

Both sets of interactive local studies, screenshots, run-by-run decisions, verification results and release limitations are preserved in `docs/SESSION-REPORT-2026-11-12.md` and the linked design notebook. Studies are development-only entries and do not ship as product routes.

## Validation

- `npm run verify`: lint, TypeScript and 209 tests across 30 files passed.
- Transcript tests cover word reveal, advance/loop, destination, focus hold/resume, reduced motion and fallback content.
- Desktop and 360 px browser review: no horizontal overflow; neutral #131315 panel, lilac text and clear counter spacing.
- Client and SSR build passed locally; SEO postbuild failed because this shell cannot resolve `registry.npmjs.org` (`ENOTFOUND`). The complete build must pass in CI and the release terminal before deployment.
- Existing >500 kB entry-bundle warning remains. Physical mobile hardware testing was not repeated.
- No new dependencies, CMS writes, archive edits, bot changes or artist-site modifications.

## Evidence

![Approved Counterpoint homepage](https://raw.githubusercontent.com/byLemonhaze/catalogue.gallery/feat/dispatch-counterpoint/docs/review/dispatch-studies-02/home-counterpoint.png)

[First six concepts](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/dispatch-counterpoint/docs/review/dispatch-studies/six-directions.png) · [Second six concepts](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/dispatch-counterpoint/docs/review/dispatch-studies-02/comparison.png) · [Full session report](https://github.com/byLemonhaze/catalogue.gallery/blob/feat/dispatch-counterpoint/docs/SESSION-REPORT-2026-11-12.md)

## Release

Owner approved release. Merge only after required CI succeeds. Build clean merged main and upload to Cloudflare project `catalogue`, branch `production`, with that exact commit SHA. A GitHub merge does not deploy this direct-upload Pages project. Record deployment evidence before claiming local/main/production alignment.
