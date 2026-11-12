Stories now has a consistent public identity and URL structure. Internal navigation uses a shared motion system, and social previews use the selected Constellation identity while preserving article and Dispatch imagery.

- Rename public Content Lab/Blog surfaces to Stories; move index and article canonicals to `/stories/` with permanent `/blog/` redirects preserving slugs and queries.
- Canonicalize About at `/about/`, redirect `/info/`, and return the CATALOGUE publisher byline to the homepage.
- Add page/story transitions alongside the Dispatch aperture, retaining existing artist portals, reduced motion, ordinary link behavior and bounded lazy-route waits.
- Deliver Constellation SVG/PNG masters, square X exports, favicon/device icons and branded social cards.
- Unify server/client sharing tags and add a full-build metadata/local-image audit, optional remote-image checks and a post-deployment smoke check.
- Preserve screenshots, decisions, session trajectory, SEO/architecture/quality notes and protected-main release instructions.

Validation: local lint, typecheck, **225 tests in 33 files**, and client/SSR compilation. The agent shell cannot resolve GitHub, npm or Sanity; complete SEO generation, remote-image checks and protected-main CI must pass in the connected release environment before deployment. No dependency or CMS-history migration.

Review evidence: `docs/review/navigation-sharing/`, `docs/review/dispatch-opening/`, `docs/BRAND-CONSTELLATION.md`, `docs/NAVIGATION-AND-SHARING-2026-11-12.md`, `docs/SESSION-REPORT-2026-11-12.md`.

After deployment, attach the merged SHA, Cloudflare deployment ID/URL, `dist/share-preview-audit.json`, `dist/production-smoke.json`, and local/origin/main comparison to the release record. Social-platform caches and physical-device motion remain manual verification limits.
