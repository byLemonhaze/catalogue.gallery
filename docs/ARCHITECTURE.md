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
| Frontend | React + Vite app (`/src`) | Public browsing, spatial home experience, submission UI, Content Lab UI |
| Edge API | Cloudflare Pages Functions (`/functions/api`) | Submission ingestion, review webhook handling, Content Lab APIs |
| Editorial CMS | Sanity Content Lake + Studio (`/studio`) | Artist/gallery records, review status, blog posts |
| Private data | Cloudflare D1 (`CONTACTS_DB`) | Encrypted submission contact emails + notification state + content drafts |
| Observability | Cloudflare Web Analytics + Function logs | Traffic analytics and basic runtime/client error visibility |
| Email provider | Resend | Approval/decline email delivery |
| AI providers | xAI + Anthropic | Content generation (`content-generate`) and website summarization (`content-scrape`) |

## Data Flow

### 1) Public Browse Flow

1. Browser loads the SPA.
2. Frontend reads public artist/gallery/post summaries from the Sanity CDN. Concurrent artist subscribers share one request; resolved lists remain cached for the SPA session. Article Markdown is fetched only when its reader opens.
3. Generated profile HTML embeds a minimal, escaped `catalogue-profile` JSON record and a website-origin preconnect. The artist route validates this record against its slug/type and can open the website while the full directory loads. A later directory response takes precedence.
4. Artist routes do not load article summaries. The artist view chunk is prefetched at idle after the homepage load, except on data-saving/slow connections. Known blocked profiles (burst, far, nullish, from the performance audit) show an unavailable state without attempting the iframe. Exit is the only CATALOGUE control on every artist view and preserves the browsing context; iframe load is not treated as proof the embedded page is usable.
5. The homepage orders its main content as carousel, directory, editorial lead, three recent stories, then four long-lived editor picks above the About/Apply footer. Lead, picks, and recent stories share one editorial selection without duplication. An optional `homepageEditorial` Sanity document controls the lead and ordered picks; the most recently updated published document wins. Missing/deleted picks fall back to the curated slugs in `src/lib/editorial.ts`, then older available stories. The reader links to the featured artist and related stories. Editorial dates are preserved. Navigation is ordered Directory, Content Lab, Apply, Search. The carousel Explore action continues into the directory. Content Lab jumps to the lead section, while both editorial sections highlight that menu item. Section jumps share measured header clearance; cross-route restoration waits for content and runs once per navigation.
6. Local Vite development/preview forwards public GET query requests through `/__catalogue_sanity` to avoid changing production CORS settings. Credentials are stripped; mutations are rejected. Images still use the public image CDN. This proxy is not part of the production deployment.

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

1. Authenticated user opens the private Content Lab at `/content-lab` and calls Content Lab endpoints with `x-content-lab-password`.
2. Draft generation can happen in two ways:
   - server mode via `/api/content-generate` using the deployment's `GROK_API_KEY`
   - BYOK mode via direct browser-to-xAI requests with a user-supplied key stored in session only
3. Generated drafts are written to D1 `content_drafts`.
4. Optional research step (`/api/content-scrape`) fetches artist website text and stores `contentBio` in Sanity.
5. Publishing (`/api/content-publish`) writes a Sanity `post` and marks the draft as published in D1.

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

- Cloudflare Pages Functions are the server-side trust boundary for site-managed secrets and side effects.
- Sanity is the source of truth for public artist/gallery/post content.
- D1 is the source of truth for private submission contact data and Content Lab draft state.
- External APIs for site-managed keys (Resend, Anthropic, server-mode xAI) are only called from Functions.
- In Content Lab BYOK mode, the browser calls xAI directly with a user-supplied key that is not stored by the site backend.

## Secrets and Sensitive Data

### Secret Locations

| Secret / Binding | Where configured | Used by |
|---|---|---|
| `CONTACTS_DB` (D1 binding) | `wrangler.toml` + Cloudflare Pages project | `submit`, `webhook`, `content-drafts`, `content-generate`, `content-publish` |
| `SANITY_WRITE_TOKEN` | Cloudflare Pages env/secrets (and local `.env.local`) | `submit`, `content-scrape`, `content-publish`, `content-upload-image` |
| `EMAIL_ENCRYPTION_KEY` | Cloudflare Pages env/secrets (and local `.env.local`) | `submit`, `webhook` |
| `WEBHOOK_SHARED_SECRET` | Cloudflare Pages env/secrets | `webhook` auth |
| `RESEND_API_KEY` | Cloudflare Pages env/secrets | `webhook` |
| `CONTENT_LAB_PASSWORD` | Cloudflare Pages env/secrets | Private Content Lab + endpoint auth |
| `GROK_API_KEY` | Cloudflare Pages env/secrets | `content-generate` |
| `CLAUDE_API_KEY` | Cloudflare Pages env/secrets | `content-scrape` |

### Non-Secret Runtime Config

- `VITE_CF_WEB_ANALYTICS_TOKEN`: optional public token for manual Cloudflare Web Analytics beacon injection.

### Security Rules

- Do not commit `.env`, `.env.local`, API keys, or encryption keys.
- Applicant emails must stay encrypted at rest and stored in D1, not in public CMS documents.
- All webhook requests must pass shared-secret validation.
- Content Lab endpoints are private and must require password header auth.
- `/content-lab` should stay password-gated because it exposes draft-management and publishing controls.
