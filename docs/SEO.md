# SEO delivery

## Product boundary

CATALOGUE navigates visitors into an artist-owned website inside the existing fullscreen iframe. Exit returns to CATALOGUE and preserves the existing exploration/return behavior. These repairs add no profile landing page, biography panel or extra step before the iframe. Artist websites are third-party content and are not edited by this repository.

For known blocked embeds (currently Burst, FAR and Nullish), and other deliberately non-embedded valid URLs, the fallback includes a direct official-website link beside the existing Exit flow. Normal working embeds retain Exit as their only control.

## Public documents

- `src/lib/seo.ts` defines production canonical URLs, full metadata and XML serialization. All canonical URLs use `https://catalogue.gallery` with trailing slashes, without query strings or fragments.
- One `Seo` component owns the active route's complete metadata. It uses the same serializer as the server and replaces tags only after React commits the route, so abandoned concurrent renders cannot retain stale article tags. Static routes are owned by the app; dynamic routes are owned by their resolved article/profile. Generated metadata is retained while a dynamic route loads.
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

## Rendering, schema and delivery

Public homepage, directory, editorial index, articles, about and submission pages render the existing React UI on the server. The same public data is serialized safely into the document and used for hydration; article bodies are included on direct article requests. The server and browser share the artist order for a stable first paint. Fullscreen artist routes retain their existing lightweight bootstrap and immediate iframe/Exit flow.

`npm run build` creates both `dist` and the bundled edge renderer in `server-dist`, then generates static public documents. Both builds must finish before Wrangler bundles Functions. Server render errors fail generation rather than shipping a loading shell. The internal `app-shell.html` is read through the asset binding and returns 404 to public requests.

The shared metadata serializer emits Organization, WebSite, WebPage, Article and BreadcrumbList JSON-LD as appropriate. Client navigation replaces only Catalogue's schema script. Publication dates use `publishedAt`, or an exact existing full `displayDate` when no timestamp exists. Unknown dates are omitted; creation timestamps are never substituted and CMS records are not rewritten. Byline links point to the existing about page.

Fonts are self-hosted under `public/fonts` with their OFL licenses. Directory thumbnails use appropriately sized, compressed images and native lazy loading. Initial article HTML includes the complete body to prevent its delayed arrival shifting the layout.

## Host controls

The global Pages middleware permanently redirects `www.catalogue.gallery`, `artfinder.pages.dev` and `production.artfinder.pages.dev` to the production origin, retaining path and query. All other `*.pages.dev` responses receive `X-Robots-Tag: noindex, follow`, including static assets and errors. Middleware therefore runs for all routes; monitor Pages Functions request/CPU usage after release. Public HTML is cached by deployed shell revision for five minutes.

The www hostname must be attached to the existing Pages project and its proxied CNAME must target `artfinder.pages.dev`. This is separate from the apex and mail records. Verify certificate activation and actual redirects after changing DNS.

## Search verification

Submit `https://catalogue.gallery/sitemap.xml` in the owner's verified Search Console property, then inspect representative artist and article URLs. Code validation and Lighthouse cannot establish Google's indexing, selected canonical, traffic or ranking changes. These require account access and subsequent Google recrawling. Artist-owned website performance and content are outside Catalogue's control.
