# SEO delivery

## Product boundary

CATALOGUE navigates visitors into an artist-owned website inside the existing fullscreen iframe. Exit returns to CATALOGUE and preserves the existing exploration/return behavior. These repairs add no profile landing page, biography panel or extra step before the iframe. Artist websites are third-party content and are not edited by this repository.

For known blocked embeds (currently Burst, FAR and Nullish), and other deliberately non-embedded valid URLs, the fallback includes a direct official-website link beside the existing Exit flow. Normal working embeds retain Exit as their only control.

## Public documents

- `src/lib/seo.ts` defines production canonical URLs, full metadata and XML serialization. All canonical URLs use `https://catalogue.gallery` with trailing slashes, without query strings or fragments.
- `Seo` owns the complete React head. Generated/server metadata uses `data-rh="true"` so Helmet adopts it instead of retaining stale article tags after navigation.
- `scripts/generate-meta.ts` generates metadata shells for all published profiles, articles and known static routes. Missing or invalid inventory stops the build. OG-image failure may fall back to a thumbnail without losing the profile page. Branded split images continue to be generated.
- Artist/gallery/article Functions take precedence over static page assets on their configured routes. They validate published records before serving the app shell, so newly published records work without a frontend rebuild and removed records return 404. Unknown profile types redirect to the sole matching correct type; ambiguous/missing matches return 404.
- Successful public profile/article HTML is cached through the Cloudflare Cache API for up to five minutes per location; tracking parameters share the same cache entry. Errors and redirects are not cached. Cache entries include the deployed shell ETag, so new releases do not reuse HTML referencing old JavaScript assets; if no ETag is available, HTML caching is bypassed. Changes and deletions can remain visible until a cached response expires. A deploy or urgent takedown may require a Cloudflare cache purge.
- The sitemap Function reads the current public inventory. The build also writes a static sitemap for inspection and local previews. Neither includes the private editor.
- A root `404.html` opts out of Cloudflare's implicit SPA success fallback. Known static React routes are generated explicitly. The React wildcard provides a usable error page during client navigation.
- Failed CMS reads return 503 with Retry-After rather than generic success pages or false 404s.
- `/content-lab/` and its admin alias are noindex in their generated HTML. Dynamic content responses on `*.pages.dev` include a noindex header.

The build-time profile card can differ from a newly published profile's card until its branded image is generated: the dynamic route uses a deployed branded image when available and otherwise uses the CMS thumbnail. Client-only profile navigation can use the original thumbnail; title, description and canonical identity remain consistent.

## Validation

Run `npm run verify` and `npm run build`. `dist/seo-manifest.json` records the fetched inventory and expected public URLs. Use `wrangler pages dev dist` to verify Functions, HTTP status codes, redirects and `_routes.json` behavior; Vite preview alone does not emulate these.

Checks cover safe escaping, metadata adoption and client-navigation cleanup, canonical normalization, sitemap validity/duplicates, new public records, removed records, CMS failures, wrong-type aliases, preview response headers, short public caching and blocked-embed fallback links. Also exercise direct artist entry, gallery entry, Exit, homepage return state and article navigation in a real browser.

## Deployment work still requiring host configuration

This change does not alter DNS, certificates or Cloudflare dashboard rules. Before release:

1. Repair TLS for `www.catalogue.gallery` and configure its permanent apex redirect.
2. Redirect the production `artfinder.pages.dev` alias to the apex, and protect or apply noindex to all preview responses, including static pages. The dynamic-route noindex header alone does not cover every preview asset/page.
3. Verify production deployment from this project's configured `production` branch. A GitHub merge alone does not deploy it (see DEPLOYMENT.md).
4. Submit the sitemap in Search Console and inspect representative rendered URLs and Google-selected canonicals.

## Follow-up scope

Full first-party content rendering, structured data, font/image performance work and editorial date normalization are separate follow-ups. Any change to visible artist context must preserve immediate embedded navigation and the Exit concept; it requires product agreement. Embedded-site performance is measured separately from what CATALOGUE controls.
