# API Documentation (`/functions/api/*`)

All endpoints are served from Cloudflare Pages Functions under `/api/*`.

## Conventions

- JSON responses include `content-type: application/json` unless noted.
- Content Lab endpoints require header `x-content-lab-password: <CONTENT_LAB_PASSWORD>`.
- Errors are returned as `{ "error": "<message>" }` unless noted.

## Endpoint Summary

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/submit` | `POST` | Public | Submit artist/gallery application |
| `/api/webhook` | `POST` | `WEBHOOK_SHARED_SECRET` header/bearer | Process Sanity review events and send emails |
| `/api/content-artists` | `GET` | Content Lab password | List published artists/galleries for Content Lab picker |
| `/api/content-drafts` | `GET` | Content Lab password | List drafts (optionally filtered by status) |
| `/api/content-drafts` | `POST` | Content Lab password | Update draft status/metadata |
| `/api/content-drafts` | `DELETE` | Content Lab password | Delete draft by id |
| `/api/content-generate` | `POST` | Content Lab password | Generate one or more drafts via Grok |
| `/api/content-scrape` | `POST` | Content Lab password | Scrape artist site + summarize into Sanity `contentBio` |
| `/api/content-publish` | `POST` | Content Lab password | Publish a draft to Sanity `post` + mark D1 state |
| `/api/content-upload-image` | `POST` | Content Lab password | Upload raw image bytes to Sanity assets |

## Endpoint Details

### `POST /api/submit`

- Request content type: `multipart/form-data`
- Required fields:
  - `name`
  - `subtitle`
  - `websiteUrl`
  - `email`
- Optional fields:
  - `type` (`artist` or `gallery`, defaults to `artist`)
  - `thumbnail` (`File`)
- Success: `200` with `{ "success": true }`
- Common errors:
  - `400` missing fields / invalid email / duplicate URL / invalid type
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

### `GET /api/content-artists`

- Header: `x-content-lab-password`
- Returns: `{ "artists": [{ "_id", "name", "subtitle", "_type" }, ...] }`
- Notes:
  - On Sanity read failures, returns `200` with empty list instead of hard error.

### `GET /api/content-drafts`

- Header: `x-content-lab-password`
- Query params:
  - `status` (optional): `pending` | `published` | `dismissed`
- Returns: `{ "drafts": [...] }`
- Errors:
  - `401` unauthorized

### `POST /api/content-drafts`

- Header: `x-content-lab-password`
- JSON body:
  - `id` (required)
  - `status` (optional)
  - `deploy_target` (optional)
  - `revision_note` (optional)
  - `sanity_doc_id` (optional)
  - `published_at` (optional)
- Returns: `{ "ok": true }`
- Errors:
  - `401` unauthorized
  - `400` missing `id`

### `DELETE /api/content-drafts`

- Header: `x-content-lab-password`
- Query params:
  - `id` (required)
- Returns: `{ "ok": true }`
- Errors:
  - `401` unauthorized
  - `400` missing `id`

### `POST /api/content-generate`

- Header: `x-content-lab-password`
- JSON body (all optional):
  - `artistId`
  - `artistName`
  - `artistSubtitle`
  - `type` (`article` | `blog` | `wildcard`)
- Behavior:
  - If `type` omitted, generates all three content types.
  - Inserts successful drafts into `content_drafts` table.
- Success: `200` with:
  - `{ "ok": true, "created": number, "attempted": number, "failures": [...] }`
- Errors:
  - `401` unauthorized
  - `500` missing `GROK_API_KEY`

### `POST /api/content-scrape`

- Header: `x-content-lab-password`
- JSON body:
  - `artistId` (required)
- Behavior:
  - Reads artist from Sanity
  - Scrapes website root + `/about`
  - Summarizes via Claude Haiku
  - Writes `contentBio` back to Sanity
- Success: `200` with `{ "ok": true, "bio": "...", "artistName": "..." }`
- Common errors:
  - `400` missing `artistId` / missing website URL
  - `401` unauthorized
  - `404` artist not found
  - `422` scrape returned insufficient content
  - `500` missing `SANITY_WRITE_TOKEN`
  - `502` upstream Sanity/Claude failures

### `POST /api/content-publish`

- Header: `x-content-lab-password`
- JSON body:
  - `id` (required)
  - `deploy_target` (required)
  - `title`, `excerpt`, `content`, `tags` (expected content payload)
  - `source_artist_id` (optional)
  - `thumbnailAssetId` (optional)
- Behavior:
  - Creates/replaces Sanity `post`
  - Updates D1 draft state to `published`
- Success: `200` with:
  - `{ "ok": true, "sanity_doc_id": "...", "slug": "...", "type": "...", "note": "..." }`
- Errors:
  - `401` unauthorized
  - `400` missing required fields
  - `500` missing `SANITY_WRITE_TOKEN`
  - `502` Sanity mutation failure

### `POST /api/content-upload-image`

- Header: `x-content-lab-password`
- Request body:
  - raw image bytes (`Content-Type: image/*`)
- Success: `200` with `{ "ok": true, "assetId": "image-..." }`
- Errors:
  - `401` unauthorized
  - `400` invalid content type or empty body
  - `500` missing `SANITY_WRITE_TOKEN`
  - `502` Sanity upload failure

## Internal Modules (Not HTTP Endpoints)

The following files are helpers only and are not routed as API endpoints:

- `_contactStore.ts`
- `_contentBank.ts`
- `_contentPrompts.ts`
- `_draftParser.ts`
- `_emailCipher.ts`
