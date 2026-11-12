# CATALOGUE.gallery architecture

Current system map, reconciled 12 November 2026. [Documentation index](README.md).

## Components and boundaries

| Layer | Implementation | Responsibility |
|---|---|---|
| Public experience | React, TypeScript, Vite, WebGL (`src/`) | Windows discovery, profiles/worlds, directory, Stories, Dispatch, Apply and search |
| Delivery | Cloudflare Pages + Functions (`functions/`), SSR bundle (`server-dist/`) | Request-time public rendering, metadata, redirects, public APIs and application/review side effects |
| Content | Sanity Content Lake and Studio (`studio/`) | Profiles, `post` Stories, `dispatch` editions, homepage editorial selection |
| Editorial production | Owner's external Grok bots | Prepare/publish approved content to Sanity; bot code and scheduler are outside this repo |
| Private applicant data | Cloudflare D1 `CONTACTS_DB` | Encrypted contact emails and notification state |
| Review email | Resend | Approval/decline notifications; replies to `apply@catalogue.gallery` |
| Observability | Cloudflare analytics and Function logs | Traffic and browser runtime error reporting |
| Retained legacy editor | `/content-lab/`, `/api/content-*`, D1 `content_drafts` | Superseded authoring implementation; [inventory and contracts](legacy/CONTENT-LAB.md) |

Sanity is the current public content source. Historical Dispatch also has a bundled archive fallback; removing a published historical Sanity override can restore that fallback. D1 is not today's editorial publishing source, although legacy draft tables remain present.

## Discovery and artist-owned worlds

The dark-only Windows interface uses Syne headings, Sora body/UI and IBM Plex Mono controls, with the handwritten `.gallery` wordmark suffix and Constellation identity. The header links Directory, Stories, Dispatch, Apply and Search.

The homepage contains a virtualized, continuously resizing WebGL artist carousel, context rail and Counterpoint Dispatch transcript. Directory browsing adds search, filters, sorting, Shuffle and grid/list views. Unified search includes profiles, Stories and Dispatch.

Profile links from discovery/search open a dialog over the current location; direct URLs render a standalone profile. Reviewed `shortBio` falls back to the existing subtitle, never internal `contentBio`. A ready website preview can reveal inside the profile image before entry. Thus embedding exists in **both profile preview and fullscreen world**, not solely the world route.

Enter world navigates to `/artist/:id/world/` or `/gallery/:id/world/`. These noindex routes canonicalize to the public profile, preserve the originating exploration, and provide a compact movable Exit control. Known blocked embeds use a clear external-site fallback. Third-party website content is outside Catalogue's control.

## Editorial production and delivery

The active editorial workflow is external Grok bots → Sanity → Catalogue. [Editorial publishing](EDITORIAL-PUBLISHING.md) documents schemas, approvals, freshness, failure behavior and the site-first Dispatch/X contract. External bot operation is owner-confirmed; its scheduler and ledger have not been audited here. The website does not need model API credentials to consume published content.

Public Pages Functions query Sanity's origin `api.sanity.io`, render the React page and serialize the public snapshot for hydration. Browser fallback reads use Sanity's CDN. Local Vite uses the GET-only `/__catalogue_sanity` proxy with credentials stripped and mutations rejected. Article bodies are included on direct Story requests; client reader navigation obtains the body when needed.

The homepage, directory, editorial indexes and detail handlers serve current published content between builds. Public HTML cache entries last up to five minutes per edge location and are keyed with the deployed shell revision. New valid published Story/Dispatch URLs do not require a rebuild. An existing hydrated tab does not continuously refresh its initial Dispatch data. See [SEO delivery](SEO.md) for precise cache and host behavior.

Stories are Sanity `post` documents at `/stories/:slug/`; old `/blog/` URLs redirect permanently. Existing stored `Article`/`Blog`/`Interview` types remain compatible. Stories have no future-timestamp embargo; keep scheduled Stories in drafts. Dispatch is a separate schema/feed at `/dispatch/:date/` with draft and future-date exclusion and historical archive merging. The sitemap is generated dynamically as well as during the build.

`DispatchSignal` renders Counterpoint with a vertical masthead, neutral counter/surface and lilac word reveals. It uses CSS/timers rather than a shader. Visibility, focus/hover and reduced motion govern playback; reduced motion exposes the complete edition. The development studies under `design/` are excluded from production app entries.

`SiteLink`, `pageOpening` and `RouteTransitionReady` coordinate native view transitions after content commits, with bounded waits and reduced-motion/fallback behavior. Profile/world navigation retains its portal treatment. About is `/about/`; `/info/` redirects. Publisher bylines link home.

## Applications and review

1. `/api/submit` validates fields, image and website embedding compatibility.
2. The server encrypts the email with `EMAIL_ENCRYPTION_KEY`, stores it in D1 `submission_contacts` and receives `contactId`.
3. It creates a pending Sanity artist/gallery with `contactId`, not the raw email.
4. Studio review publishes or declines the application with optional approval/rejection notes.
5. The authenticated `/api/webhook` resolves/decrypts the recipient, deduplicates contact/status notifications, sends through Resend and records notification state. A legacy encrypted-email fallback remains for older records.

Published-profile consumption is separate from editorial bot publishing. The contact store must remain available even if the legacy editor is retired.

## Secrets and trust boundaries

| Config / binding | Current site use |
|---|---|
| `CONTACTS_DB` | Applicant contacts/notifications; shared with retained legacy drafts |
| `SANITY_WRITE_TOKEN` | Server-side application writes; also referenced by legacy editor endpoints |
| `EMAIL_ENCRYPTION_KEY` | Contact encryption/decryption |
| `WEBHOOK_SHARED_SECRET` | Review webhook authentication |
| `RESEND_API_KEY`, sender/reply config | Review notification delivery |
| Sanity project/dataset, public base URL | Public read and metadata configuration |
| `VITE_CF_WEB_ANALYTICS_TOKEN` | Optional public analytics token |

`CONTENT_LAB_PASSWORD`, `GROK_API_KEY` and `CLAUDE_API_KEY` belong to the retained legacy implementation, not the current public editorial read path. See its [dependency inventory](legacy/CONTENT-LAB.md) before changing any deployment secrets. External bot credentials are managed separately and must never enter the frontend.

Keep applicant emails encrypted in D1, validate webhook authentication, and never commit secrets. Noindex does not secure a private interface. Browser production errors are sent to `/api/client-errors` and logged by Functions; logging does not establish external bot health.

## Verification boundaries

Source inspection establishes available behavior, not deployed secrets, Cloudflare settings, external bot schedules or successful X publication. Build-time snapshots and historical screenshots are dated evidence. Current runtime expectations live in this guide, [publishing](EDITORIAL-PUBLISHING.md), [API](API.md), [deployment](DEPLOYMENT.md) and [quality](QUALITY.md); historical decision records remain linked from the [index](README.md).
