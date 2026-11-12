# Navigation, Stories and sharing — 2026-11-12

> **Historical checkpoint.** This record preserves the decisions, terminology, screenshots and verification status at that stage. Pending/local-only release statements and old commands are not current deployment instructions. Use the [documentation index](README.md), [current publishing guide](EDITORIAL-PUBLISHING.md) and [reconciled audit](DOCUMENTATION-AUDIT-2026-11-12.md) for current context.

## Scope and decisions

This local follow-up extends the approved visual language; it does not change discovery, artist content or Dispatch history.

- Normal internal pages use a 400 ms opening; stories use a 560 ms horizontal torn reveal; Dispatch keeps its 540 ms signal aperture. The masthead stays stable.
- `SiteLink` preserves link semantics, modifier/new-tab actions and route state. Artist profiles/world entry retain their own motion. `RouteTransitionReady` waits for destination commit inside Suspense; a 900 ms safety limit skips slow native transitions. Unsupported browsers and reduced motion receive a quiet arrival. Browser back/forward use the quieter arrival.
- Stories replaces public Content Lab/Blog labels. Canonical routes are `/stories/` and `/stories/:slug/`. The private editorial workspace and historical data remain intact.
- Legacy `/blog/` routes receive HTTP 301 redirects to the same slug under `/stories/`. Local React routing also redirects, preserving query/hash. Existing links in stored article content are normalized when rendered.
- About has one canonical route, `/about/`; `/info/` is an alias redirect. The CATALOGUE article byline links home, not to About. About copy was not rewritten.

## Sharing

One metadata serializer supplies both server and client tags. The Constellation landscape card is the branded fallback, while story and Dispatch images remain content-specific. New profile composites use the versioned Constellation directory. OG/Twitter image URLs match and are absolute; alt text, site identity and applicable publication dates are included. Optional metadata from the previous route is removed.

The full build runs `audit:shares` over every generated public route. It verifies canonical/share URLs, required tags, duplicates, matching images and local raster availability. `npm run audit:shares -- --remote` additionally checks unique remote images. Fixture tests prove that missing local previews fail the audit.

## Evidence

- Browser: supplied legacy Experimental Television Center URL redirected to the same Stories slug, retaining query/hash; Story label and publisher link home confirmed.
- About alias and Stories navigation confirmed; no captured browser errors.
- Mobile Stories at 390 × 844: document width and scroll width both 390 px.
- [Desktop Stories](review/navigation-sharing/stories-desktop.png)
- [Mobile Stories](review/navigation-sharing/stories-390.png)
- [Article opening intermediate frame](review/navigation-sharing/story-opening.png)

## Release limitations

The desktop/native transition is a brief snapshot effect; lower-powered devices and browsers without View Transitions use a simpler arrival. Reduced motion avoids the geometric reveal. Real iOS Safari performance has not been measured in this follow-up.

The agent environment cannot reach the network-backed Sanity inventory/build dependency download. Client/SSR compilation and automated tests can run here; the complete SEO build and remote-image audit must run in the network-enabled release environment. Never deploy the partial `--ignore-scripts` build.

This follow-up is not committed or deployed. Before publication: complete CI/full build, inspect `dist/share-preview-audit.json`, merge through the protected-main PR flow, deploy the merged clean main SHA, and check production 301s, HTML metadata and actual social unfurls. X and other platforms may retain older cached previews until they recrawl.

Validation completed: `npm run verify` passed lint, TypeScript and **224 tests in 33 files**. Client and SSR compilation passed with `npm run build --ignore-scripts`; the existing >500 kB client-chunk warning remains (612.48 kB minified / 178.95 kB gzip). This compilation intentionally excludes the network-backed SEO postbuild and is not a release artifact.
