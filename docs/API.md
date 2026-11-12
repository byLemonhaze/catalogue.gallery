# API Documentation (`/functions/api/*`)

All endpoints are served from Cloudflare Pages Functions under `/api/*`.

## Conventions

- JSON responses include `content-type: application/json` unless noted.
- Retained legacy `/api/content-*` contracts and authentication are documented separately in [Legacy Content Lab](legacy/CONTENT-LAB.md). They are not the current editorial workflow.
- Errors are returned as `{ "error": "<message>" }` unless noted.

## Endpoint Summary

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/artists` | `GET` | Public | Read-only public directory feed for published profiles |
| `/api/client-errors` | `POST` | Public | Collect browser runtime errors into Cloudflare logs |
| `/api/check-embed` | `GET` | Public | Check website embedding permissions for catalogue.gallery |
| `/api/submit` | `POST` | Public | Submit artist/gallery application |
| `/api/webhook` | `POST` | `WEBHOOK_SHARED_SECRET` header/bearer | Process Sanity review events and send emails |

## Endpoint Details

### `GET /api/artists`

- Auth: none (public)
- Query params:
  - `type` (optional): `artist` | `gallery` | `collector`
  - `limit` (optional): integer between `1` and `500` (default `200`)
- Returns:
  - `{ "generatedAt": "...", "count": number, "artists": [...] }`
- Artist object fields:
  - `id`
  - `slug`
  - `type`
  - `name`
  - `subtitle`
  - `websiteUrl`
  - `thumbnailUrl`
  - `profileUrl` (empty string for types that do not have a public profile route yet)
- Cache headers:
  - `cache-control: public, max-age=300, s-maxage=600, stale-while-revalidate=3600`
- Common errors:
  - `400` invalid `type`
  - `502` Sanity fetch failure
  - `500` unexpected server error

### `POST /api/client-errors`

- Auth: none (public)
- Purpose:
  - Receives browser `error` / `unhandledrejection` events from production builds.
  - Logs structured events to Cloudflare Functions logs for basic operational visibility.
- Request content type:
  - `application/json`
- Request body (all fields optional, best effort):
  - `type`, `message`, `stack`, `source`, `line`, `column`, `pageUrl`, `userAgent`, `timestamp`
- Success:
  - `202` with `{ "ok": true }`
- Common errors:
  - `400` invalid JSON body
  - `415` unsupported content type

### `GET /api/check-embed`

- Query: `url` (required public HTTPS URL; no credentials, IP literals, local domains or custom ports).
- Returns `200` with `{ "status": "compatible" | "blocked" | "unknown", "message": "..." }` and `Cache-Control: no-store`.
- Invalid input returns `400` with `{ "error": "..." }`.
- Uses GET and inspects the final HTML response after at most four redirects with an eight-second overall timeout. Redirect destinations are validated before fetching; HTTP downgrades are blocked. Response bodies are discarded.
- Evaluates enforced CSP `frame-ancestors` for `https://catalogue.gallery`, including multiple policies, and falls back to `X-Frame-Options` when no enforced `frame-ancestors` directive exists. Report-only policies do not grant permissions.
- `unknown` includes network errors, non-HTML pages, unsuccessful HTTP responses and redirect failures. It does not mean the provider blocks embedding.
- This checks response-header permissions, not a browser render. JavaScript behavior, challenges, login requirements and different responses served to browsers still require the existing editorial review.
- Intended for Cloudflare Pages Functions' public outbound fetch runtime; do not expose an unrestricted local development server to untrusted callers.
- Apply checks automatically after 600 ms without typing, cancels stale checks, and rechecks on window focus or on leaving the URL field after an unsuccessful check. No Test button is needed.

### `POST /api/submit`

- Request content type: `multipart/form-data`
- Required fields:
  - `name`
  - `subtitle` (nonblank, at most 35 characters)
  - `websiteUrl` (public HTTPS URL; same validation as `/api/check-embed`)
  - `email` (valid contact address)
  - `thumbnail` (nonempty JPG, PNG, WebP or GIF `File`, at most 10 MiB)
- Optional fields:
  - `type` (`artist` or `gallery`, defaults to `artist`)
- All text fields are trimmed. Whitespace-only values and files supplied in text fields are rejected. An uploaded image asset is required before the pending listing is created.
- Embedding permissions are checked again on the server before storage; client check results are never trusted. Clicking Submit on an incomplete form highlights all missing or invalid fields together without sending a request. Once the details are complete, Submit remains disabled until the current URL has a compatible check.
- Success: `200` with `{ "success": true }`
- Common errors:
  - `400` missing fields / invalid image, URL or email / subtitle too long / duplicate URL / invalid type
  - `422` website blocks embedding (`embedStatus: "blocked"`)
  - `503` website could not be checked (`embedStatus: "unknown"`); retry after resolving connectivity/access issues
  - `500` missing server config (`SANITY_WRITE_TOKEN`, `EMAIL_ENCRYPTION_KEY`, `CONTACTS_DB`) or upstream failure

### `POST /api/webhook`

- Auth accepted from:
  - `x-webhook-secret`
  - `x-sanity-webhook-secret`
  - `Authorization: Bearer <WEBHOOK_SHARED_SECRET>`
- Payload: Sanity webhook body containing review data (`status`, `contactId`/`email`, `name`, `slug`, etc.)
- Behavior:
  - Sends email only for `status` of `published` or `declined`
  - Dedupe guard prevents sending duplicate notifications for same `(contactId, status)`
- Success:
  - `200` with `{ "success": true, "provider": {...} }`
  - `200` with `{ "message": "No action for status: ..." }` when status is neither `published` nor `declined`
- Common errors:
  - `401` invalid webhook secret
  - `400` missing contact/email
  - `500` missing secrets/config or email provider failure

## Internal Modules (Not HTTP Endpoints)

The following files are helpers only and are not routed as API endpoints:

- `_contactStore.ts`
- `_contentBank.ts` (legacy editor)
- `_contentPrompts.ts` (legacy editor)
- `_draftParser.ts` (legacy editor)
- `_emailCipher.ts`
- `_embedCheck.ts`

## Public SEO routes

`GET`/`HEAD /artist/:slug/`, `/gallery/:slug/`, `/stories/:slug/` and `/dispatch/:date/` return server-rendered public HTML with content-specific metadata. Unknown records return 404; failures in required CMS reads return 503. Wrong-type profile aliases and missing trailing slashes redirect permanently. `GET /sitemap.xml` returns current published URLs.

`/blog/` and `/blog/:slug/` permanently redirect to `/stories/` and `/stories/:slug/`; `/info/` redirects to `/about/`. Public indexes and the homepage also use request-time rendering. See [SEO delivery](SEO.md) for caching, preview hosts and fallback behavior.

These are public reading surfaces. Current external Grok bots publish directly to Sanity using their own protected credentials; no new site editorial write API is required. The bot implementation is outside this repository. See [Editorial publishing](EDITORIAL-PUBLISHING.md).
