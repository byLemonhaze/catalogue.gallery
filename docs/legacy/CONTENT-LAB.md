# Legacy Content Lab: retained implementation

Status: retained code, superseded operational workflow. Reviewed 12 November 2026.

The owner now produces editorial content with external Grok bots and Sanity. This file documents the previous in-repository editor so maintainers can understand and eventually retire it. It is **not** the current publishing runbook. Use [Editorial publishing](../EDITORIAL-PUBLISHING.md) instead.

Documentation changes do not disable endpoints, revoke credentials, remove workflows or delete data. Deployment configuration and actual usage of these legacy paths have not been inspected in this audit. Noindex is an indexing directive, not authentication.

## Inventory and dependencies

| Retained surface | Source / dependency | Role |
|---|---|---|
| `/content-lab/`, `/content-lab/admin` | `src/App.tsx`, `src/pages/ContentLab.tsx` | Previous private editor, distinct from public Stories |
| `/api/content-*` | `functions/api/content-*.ts`, `CONTENT_LAB_PASSWORD` | Password-header-protected draft, generation and publishing APIs |
| Server generation | `content-generate.ts`, `GROK_API_KEY` | xAI call; source model `grok-4-0709` |
| Browser BYOK | `src/lib/contentLab/byok.ts` | Direct xAI request with a session-storage key |
| Website summarization | `content-scrape.ts`, `CLAUDE_API_KEY`, `SANITY_WRITE_TOKEN` | Anthropic call; source model `claude-haiku-4-5-20251001`; writes `contentBio` |
| Draft persistence | `CONTACTS_DB`, `migrations/003_content_drafts.sql` | D1 `content_drafts`, separate from applicant contact records |
| Publishing and media | `content-publish.ts`, `content-upload-image.ts`, `SANITY_WRITE_TOKEN` | Sanity mutations; older publisher label `Catalogue Content Lab` remains in code |
| Manual workflow | `.github/workflows/content-generate.yml` | `workflow_dispatch`; not a scheduled external Grok bot |
| Generation helpers | `_contentBank.ts`, `_contentPrompts.ts`, `_draftParser.ts` | Legacy prompt and parsing support |

Source paths above are relative to the repository root. Model names describe retained source code, not the configuration of today's external bots. Neither xAI nor Anthropic keys are needed by the website to **read** published Stories or Dispatch.

The former sequence was: choose an artist → optionally research their website → generate via server key or BYOK → save drafts in D1 → review → publish a Sanity `post`. The external bot workflow does not require these endpoints.

## Migration tooling: maintenance only

`scripts/migrate-articles.ts` and `npm run migrate:articles` retain the old local article import. It uses `createOrReplace` for deterministic `post-<slug>` IDs: rerunning can overwrite CMS edits. This is not normal setup, daily publishing, or a safe refresh command. Review the source and destination, export a backup, and obtain explicit authorization for any production migration. Legacy `/blog/` links already redirect to `/stories/`; they do not require reimporting content.

Do not drop D1 tables or remove shared Sanity credentials merely because this editor is legacy. Applicant contacts and review notifications still depend on D1; applications still need server-side Sanity writes.

## Retained endpoint contracts

All routes below require `x-content-lab-password: <CONTENT_LAB_PASSWORD>`. They remain code-delivered interfaces; their presence is not evidence that the current editorial team uses them.

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
  - Create mode:
    - `operation: "create"`
    - `type` (required): `article` | `blog` | `wildcard`
    - `title`, `excerpt`, `content` (required)
    - `tags` (optional string array)
    - `source_artist_id`, `source_artist_name` (optional)
  - Update mode:
    - `id` (required)
    - `status` (optional)
    - `deploy_target` (optional)
    - `revision_note` (optional)
    - `sanity_doc_id` (optional)
    - `published_at` (optional)
- Returns:
  - create: `{ "ok": true, "draft": {...} }`
  - update: `{ "ok": true }`
- Errors:
  - `401` unauthorized
  - `400` missing `id` or required create fields

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

Notes:
- The private `/content-lab` UI also supports a BYOK mode where the browser calls xAI directly with a user-supplied key and then saves the generated draft through `POST /api/content-drafts`.

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

## Retirement checklist (not executed)

Confirm callers and the manual workflow are unused; preserve any required drafts; remove UI/routes/endpoints/workflow in a dedicated code PR; then revoke only credentials proven exclusive to that path. Keep privacy, applicant review, public Sanity reads and existing published content intact. Test and deploy the retirement separately.
