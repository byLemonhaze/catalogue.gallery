# CATALOGUE Constellation identity

Selected by the owner on 12 November 2026 (America/Toronto), from direction 09 of the first ten vector studies. This replaces the previous single-square symbol. The CATALOGUE wordmark and handwritten `.gallery` remain.

## Masters and exports

All files are under `public/brand/`:

- `catalogue-constellation.svg`: original approved geometry on charcoal, 1000 × 1000 viewBox. Four independent windows, no raster content.
- `catalogue-constellation-transparent.svg`: transparent vector master.
- `catalogue-constellation-2048.png`: 2048 × 2048 avatar, ready for the X account. Keeps the approved spacing and fits circular cropping.
- `catalogue-constellation-512.png`: publisher/schema logo.
- `favicon-constellation.svg` / `favicon-constellation-64.png`: tighter optical crop for small tab sizes, with identical geometry.
- `apple-touch-icon-constellation.png` (180 px), `icon-constellation-192.png` and `icon-constellation-512.png`: device/bookmark icons.
- `catalogue-social-constellation.svg` / `.png`: 1200 × 630 share card with the symbol, CATALOGUE wordmark and handwritten signature.
- `catalogue-wordmark.svg`: outlined Sora lettering reused from the approved X banner. `.gallery` is the existing outlined Caveat signature. Licenses and signature provenance are in `public/fonts/`.

Palette: charcoal **#131315**, warm white **#F3F1ED**. The charcoal exactly matches the existing X banner. No image generation was used. Rebuild exports with `node scripts/generate-brand-assets.mjs`; this uses the existing Sharp dependency.

Legacy `/logo.png`, `/favicon.png`, `/favicon.ico` and `src/assets/logo.png` are replaced for compatibility. The HTML uses newly named favicon/Apple icon URLs and `site.webmanifest`. Default Open Graph/Twitter metadata uses the new landscape card; organization schema uses the square logo. Article and Dispatch-specific imagery is preserved rather than replacing artwork or changing historical plates.

Profile share cards keep the existing logo/art split. Their logo pane and padding now use Constellation on #131315, with a quiet dark divider. Generator and edge lookup both use `/og/profiles/constellation/` so a full release build creates new share-image URLs. These profile images must be regenerated with the complete `npm run build` before deployment. External social platforms may retain older previews until they recrawl a shared page.

## Validation and release status

- Exported SVG geometry, 2048 px avatar and 1200 × 630 social card visually inspected.
- Lint/typecheck and 214 tests across 31 files passed, including a metadata regression test for the new default image/publisher logo and preservation of article imagery.
- Client/SSR build checked separately from the network-dependent SEO postbuild. This is not a claim that every profile share card has been regenerated locally.
- Local change only. No X account modification, commit, push or production deployment performed for this selection. The owner can upload the avatar immediately; site assets become public with the next approved release.
