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

1. Public routes deliver prerendered React content and a shared CMS snapshot; the browser hydrates it. The existing Cloudflare middleware and dynamic article/profile handlers keep newly published content accessible between builds.
2. The Windows homepage combines a virtualized, continuously resizing artist carousel with a concise context rail and one editorial lead. Recent stories and editor picks below retain the existing Sanity editorial selection and deduplication. Navigation links directly to Directory, Content Lab and Apply.
3. `/artists/` provides a complete linked inventory with client search, filters and grid/list layouts. Profile links from discovery, directory and search open a native dialog using a React Router background location. Direct profile requests render the same content as a standalone page.
4. Public profiles use the optional reviewed `shortBio` field, falling back to their existing subtitle. Internal `contentBio` research remains separate. Profile HTML and metadata are generated at build time and on dynamic profile responses.
5. Enter world navigates to `/artist/:id/world/` or `/gallery/:id/world/`. These routes validate and bootstrap the profile, are noindex, and canonicalize to its public profile. Only this route embeds the artist website. The originating discovery page remains mounted through overlay and world entry. Known blocked profiles retain their external-site fallback. Exit returns to the profile.
6. Artist/gallery/post data still comes from the existing Sanity query layer. Article Markdown is fetched only when its reader opens. Local Vite proxies public GET query requests through `/__catalogue_sanity`; credentials are stripped and mutations rejected. Production uses the public CDN.

See [Windows implementation and verification](./WINDOWS-REDESIGN.md) for the biography contract and release review.

### Homepage Dispatch presentation

`DispatchSection` selects the latest edition through `useDispatches`, retaining the published Sanity/bundled-archive merge rules. `DispatchSignal` presents Counterpoint: one vertical heading, a neutral counter and lilac word reveals. CSS reserves headline space; no shader or additional rendering dependency is used. Visibility and reduced-motion preferences govern progress, hover/focus holds the completed current story, and all headlines are available in the accessible link description. Reduced motion shows the complete static edition. All editions and Read the edition preserve the existing archive/detail routes.

The independent HTML entries under `design/` and modules in `src/design/` are development studies, not application routes or production build entries. See [session report](SESSION-REPORT-2026-11-12.md) for their purpose and validation.

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

## Public navigation and Stories follow-up (2026-11-12)

`SiteLink`, `pageOpening` and `RouteTransitionReady` coordinate native view transitions after route content commits, with a bounded wait and reduced-motion fallback. Profile/world links retain their portal behavior. Public editorial routes are `/stories/` and `/stories/:slug/`; `/blog/` is a permanent compatibility redirect. `/about/` replaces `/info/` with the same compatibility behavior. Both the Pages middleware and local React routing implement aliases. The private `/content-lab/` workspace is unchanged. See `NAVIGATION-AND-SHARING-2026-11-12.md` and `SEO.md` for sharing and release checks.
