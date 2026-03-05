# CATALOGUE.gallery Architecture

## Purpose

This document is the high-level engineering map for `catalogue.gallery`:

- how data moves through the system
- how the submission/review workflow works
- what services are involved
- where secrets and sensitive data live

## System Components

| Layer | Component | Responsibility |
|---|---|---|
| Frontend | React + Vite app (`/src`) | Public browsing, submission UI, Content Lab UI |
| Edge API | Cloudflare Pages Functions (`/functions/api`) | Submission ingestion, review webhook handling, Content Lab APIs |
| Editorial CMS | Sanity Content Lake + Studio (`/studio`) | Artist/gallery records, review status, blog posts |
| Private data | Cloudflare D1 (`CONTACTS_DB`) | Encrypted submission contact emails + notification state + content drafts |
| Observability | Cloudflare Web Analytics + Function logs | Traffic analytics and basic runtime/client error visibility |
| Email provider | Resend | Approval/decline email delivery |
| AI providers | xAI + Anthropic | Content generation (`content-generate`) and website summarization (`content-scrape`) |

## Data Flow

### 1) Public Browse Flow

1. Browser loads the SPA.
2. Frontend reads published artist/gallery/post content from Sanity APIs.
3. Profile routes render artist pages and iframe artist websites.

### 2) Submission Flow (`POST /api/submit`)

1. Visitor submits form data (`name`, `subtitle`, `websiteUrl`, `email`, etc.).
2. Function validates fields and normalizes URL.
3. Email is encrypted server-side (`EMAIL_ENCRYPTION_KEY`).
4. Ciphertext is written to D1 (`submission_contacts`) and a `contactId` is returned.
5. A pending `artist` or `gallery` document is created in Sanity with `contactId` (not raw email).

### 3) Review + Notification Flow (`POST /api/webhook`)

1. Reviewer updates status in Sanity Studio (`published` or `declined`).
2. Sanity webhook sends payload to `/api/webhook` with shared secret.
3. Function resolves recipient email (from D1 `contactId`, or legacy encrypted payload fallback).
4. Function dedupes per-contact/per-status notifications.
5. Function sends templated email via Resend and records notification metadata in D1.

### 4) Content Lab Flow

1. Authenticated user calls Content Lab endpoints with `x-content-lab-password`.
2. Draft generation (`/api/content-generate`) writes drafts to D1 `content_drafts`.
3. Optional research step (`/api/content-scrape`) fetches artist website text and stores `contentBio` in Sanity.
4. Publishing (`/api/content-publish`) writes a Sanity `post` and marks the draft as published in D1.

### 5) Basic Error Observability

1. Browser captures uncaught runtime errors and unhandled promise rejections in production.
2. Frontend sends events to `POST /api/client-errors`.
3. Function logs structured payloads into Cloudflare logs for debugging.

## Review Flow

1. Submission arrives as `status: "pending"` in Sanity.
2. Reviewer checks pending entries in Studio (`In Review (New)`).
3. Reviewer sets status + optional notes (`approvalMessage`, `rejectionReasonCode`, `rejectionReason`).
4. Webhook emits event and notification is sent.
5. Applicant either appears live (`published`) or is guided to re-apply (`declined`).

## Services and Boundaries

- Cloudflare Pages Functions are the server-side trust boundary for secrets and side effects.
- Sanity is the source of truth for public artist/gallery/post content.
- D1 is the source of truth for private submission contact data and Content Lab draft state.
- External APIs (Resend, xAI, Anthropic) are only called from Functions, never from browser code.

## Secrets and Sensitive Data

### Secret Locations

| Secret / Binding | Where configured | Used by |
|---|---|---|
| `CONTACTS_DB` (D1 binding) | `wrangler.toml` + Cloudflare Pages project | `submit`, `webhook`, `content-drafts`, `content-generate`, `content-publish` |
| `SANITY_WRITE_TOKEN` | Cloudflare Pages env/secrets (and local `.env.local`) | `submit`, `content-scrape`, `content-publish`, `content-upload-image` |
| `EMAIL_ENCRYPTION_KEY` | Cloudflare Pages env/secrets (and local `.env.local`) | `submit`, `webhook` |
| `WEBHOOK_SHARED_SECRET` | Cloudflare Pages env/secrets | `webhook` auth |
| `RESEND_API_KEY` | Cloudflare Pages env/secrets | `webhook` |
| `CONTENT_LAB_PASSWORD` | Cloudflare Pages env/secrets | Content Lab endpoint auth |
| `GROK_API_KEY` | Cloudflare Pages env/secrets | `content-generate` |
| `CLAUDE_API_KEY` | Cloudflare Pages env/secrets | `content-scrape` |

### Non-Secret Runtime Config

- `VITE_CF_WEB_ANALYTICS_TOKEN`: optional public token for manual Cloudflare Web Analytics beacon injection.

### Security Rules

- Do not commit `.env`, `.env.local`, API keys, or encryption keys.
- Applicant emails must stay encrypted at rest and stored in D1, not in public CMS documents.
- All webhook requests must pass shared-secret validation.
- Content Lab endpoints are private and must require password header auth.
