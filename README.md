# CATALOGUE.gallery

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/byLemonhaze/catalogue.gallery/badge)](https://securityscorecards.dev/viewer/?uri=github.com/byLemonhaze/catalogue.gallery) [![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12104/badge)](https://www.bestpractices.dev/projects/12104)

Catalogue.gallery is a discovery platform designed around the idea that artists should own their digital environments. Instead of hosting artwork, the platform acts as a navigation layer that lets viewers explore each artist's personal website directly through an embedded browsing interface. This creates a fluid discovery experience while preserving the uniqueness of each artist's creative world. The result is a system where curation and independence coexist, turning the platform into a portal for navigating distributed digital art ecosystems.

## Stack

- Frontend: React + TypeScript + Vite
- Content + review backend: Sanity Studio (`/studio`)
- Public API endpoints: Cloudflare Pages Functions (`/functions/api`)
- Email delivery: Resend
- Inbox/reply workflow: ProtonMail (via `reply_to`)
- Editorial/blog content: Sanity `post` documents (served at `/blog/:slug`)

## Engineering Docs

- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- API contract: [`docs/API.md`](./docs/API.md)
- Quality and verification policy: [`docs/QUALITY.md`](./docs/QUALITY.md)
- Deployment runbook: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- Product roadmap notes: [`docs/ROADMAP.md`](./docs/ROADMAP.md)

## Security

- Security policy and reporting process: [`SECURITY.md`](./SECURITY.md)
- Please report vulnerabilities privately through GitHub private vulnerability reporting when possible.

## Reporting and Collaboration

- Public bug reports: [GitHub Issues](https://github.com/byLemonhaze/catalogue.gallery/issues)
- New issue form: [Report a bug or request a feature](https://github.com/byLemonhaze/catalogue.gallery/issues/new/choose)
- Private vulnerability reporting: [GitHub Security Advisories](https://github.com/byLemonhaze/catalogue.gallery/security/advisories/new)
- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

Repository documentation, issues, and pull request discussions are maintained in English so bug reports, review notes, and operational guidance stay searchable and reusable.

## Releases and Versioning

- Public releases are published on [GitHub Releases](https://github.com/byLemonhaze/catalogue.gallery/releases).
- Starting with `v0.1.0`, the project uses [Semantic Versioning](https://semver.org/) for repository releases.
- Human-readable release notes are tracked in [`CHANGELOG.md`](./CHANGELOG.md).

## Local Development

1. Install dependencies:
   - `npm install`
   - `cd studio && npm install`
2. Create local env file:
   - `cp .env.example .env.local`
3. Run app:
   - `npm run dev`
4. Run Sanity Studio:
   - `cd studio && npm run dev`

## Environment Variables

Use `.env.local` for local secrets. Never commit `.env` or `.env.local`.

Required app/server env vars:

- `VITE_SANITY_PROJECT_ID`
- `VITE_SANITY_DATASET`
- `SANITY_WRITE_TOKEN` (server-side write token for submit endpoint)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (example: `CATALOGUE <apply@catalogue.gallery>`)
- `RESEND_REPLY_TO` (set to your ProtonMail address)
- `PUBLIC_BASE_URL` (example: `https://catalogue.gallery`)
- `VITE_CF_WEB_ANALYTICS_TOKEN` (optional; only needed for manual beacon mode)
- `WEBHOOK_SHARED_SECRET` (required; webhook requests are rejected without it)
- `EMAIL_ENCRYPTION_KEY` (32-byte base64 key used to encrypt contact emails before storing in Sanity)
- `SANITY_PROJECT_ID` (optional server override)
- `SANITY_DATASET` (optional server override)

Cloudflare binding (not an env var):

- `CONTACTS_DB` (D1 binding used for private contact storage)

## Submission + Review Flow

1. User submits via `/submit`.
2. `POST /api/submit` creates a Sanity `artist` or `gallery` document with:
   - `status: "pending"`
   - stores email in private D1 and writes `contactId` to Sanity
3. You review in Sanity Studio:
   - pending list: `In Review (New)`
   - for fast workflow use document actions:
     - `Approve & Notify`
     - `Decline & Notify`
   - for declines choose `rejectionReasonCode` and optionally add `rejectionReason` details
   - for approvals optionally add `approvalMessage`
4. Sanity webhook calls `POST /api/webhook`.
5. `/api/webhook` sends approval/decline email through Resend.

### Contact Email Privacy

- Recommended mode: keep applicant emails in private Cloudflare D1 (`submission_contacts`) and only store `contactId` in Sanity.
- Submit endpoint now requires `CONTACTS_DB`; new submissions fail closed if D1 binding is missing.
- Webhooks decrypt server-side only (requires `EMAIL_ENCRYPTION_KEY`).

### Cloudflare D1 Contact Store Setup

1. Create database:
   - `npx wrangler d1 create catalogue-private-contacts`
2. Add binding in `wrangler.toml` (replace `database_id`):
   - `[[d1_databases]]`
   - `binding = "CONTACTS_DB"`
   - `database_name = "catalogue-private-contacts"`
   - `database_id = "<your-database-id>"`
3. Apply schema:
   - `npx wrangler d1 execute catalogue-private-contacts --remote --file=./migrations/001_submission_contacts.sql`
4. Deploy app again so Functions can use the binding.
5. Migrate old encrypted emails from Sanity into D1 and remove legacy `email` fields:
   - `cd studio && npm run migrate:contacts:d1`

## Editorial / Blog Flow

1. Blog/interview/article entries live in Sanity as `post` documents.
2. Keep slugs stable to preserve URLs: `/blog/:slug`.
3. `npm run build` runs `postbuild`, which generates static meta pages in `dist/blog/<slug>/index.html`.
4. Social OG/Twitter images are sourced from Sanity `post.thumbnail` (with legacy fallback).
5. In-article entity linking still auto-links published names to profile routes.

### Migrate Existing Local Articles to Sanity

Run once (idempotent by `createOrReplace` on `post-<slug>` ids):

```bash
npm run migrate:articles
```

This imports current local articles using the same slug ids, preserving existing `/blog/...` links.

## Content Lab

A password-protected editorial tool at `/content-lab` for generating, reviewing, and publishing articles — without touching Sanity directly.

**Flow:**

1. Select an artist from the directory (or generate for a random one)
2. Optionally hit **Research** to scrape the artist's website and cache a factual bio in Sanity (`contentBio` field)
3. Hit **Generate** — Grok-4 searches X/Twitter and the web in real time and writes from what it actually finds
4. Review the draft, edit inline, then publish directly to Sanity

**Content types:**

| Type | Voice | Length |
|------|-------|--------|
| Article | Cultural criticism, third person, structured sections | 700–950 words |
| Blog | Short editorial, first person, one strong observation | 250–380 words |
| Wildcard | Deep-dive on a collection, concept, or moment | 450–700 words |

**API endpoints** (`functions/api/`):

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/artists` | `GET` | Public, read-only directory feed for published profiles |
| `/api/client-errors` | `POST` | Collects browser runtime errors into Cloudflare logs |
| `/api/content-generate` | `POST` | Grok-4 with live web + X search → drafts → D1 |
| `/api/content-scrape` | `POST` | Scrapes artist website → Claude Haiku summarizes → saves to Sanity `contentBio` |
| `/api/content-publish` | `POST` | Publishes approved draft from D1 → Sanity `post` |
| `/api/content-drafts` | `GET` | Lists drafts stored in D1 |
| `/api/content-drafts` | `POST` | Updates draft status (approve / dismiss / edit) |
| `/api/content-drafts` | `DELETE` | Deletes a draft |
| `/api/content-artists` | `GET` | Lists published artists/galleries for Content Lab picker |
| `/api/content-upload-image` | `POST` | Uploads image assets to Sanity for draft publishing |

Full endpoint details: [`docs/API.md`](./docs/API.md)

**Additional env vars required:**

- `GROK_API_KEY` — xAI API key (Grok-4, primary generation model)
- `CLAUDE_API_KEY` — Anthropic API key (Claude Haiku, used for website summarization only)
- `CONTENT_LAB_PASSWORD` — auth password for the `/content-lab` route

## ProtonMail + Resend Setup (Recommended)

Use Resend to send mail and ProtonMail to receive replies:

1. In Resend:
   - verify `catalogue.gallery` domain with DNS records
   - set sender as `CATALOGUE <apply@catalogue.gallery>`
2. In Cloudflare Pages env vars:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL=CATALOGUE <apply@catalogue.gallery>`
   - `RESEND_REPLY_TO=yourname@proton.me`
3. In Sanity webhook settings:
   - URL: your deployed webhook endpoint
   - Trigger: document create/update for `artist` and `gallery`
   - Configure the shared secret header using `WEBHOOK_SHARED_SECRET`

This keeps deliverability high (Resend) while all replies route back to ProtonMail.

## Testing

```bash
npm test          # Run once
npm test -- --run # Run once (CI)
npm run test:watch # Watch mode
npm run verify    # Lint + typecheck + tests
```

19 unit tests across 3 suites:
- `linkUtils.ts` — entity linking, double-link prevention, sort-by-length correctness
- `useArtists` hook — loading state, Sanity mapping, fetch error paths
- `useArticles` hook — post mapping, legacy fallback, thumbnail normalization

Verification policy, static analysis, and the new-functionality test policy are documented in [`docs/QUALITY.md`](./docs/QUALITY.md).

## Useful Scripts

- Build app: `npm run build`
- Migrate local article archive to Sanity posts: `npm run migrate:articles`
- Migrate old artists: `npx -y tsx scripts/migrate-artists.ts`
- Purge artists: `npx -y tsx scripts/purge-artists.ts`
- Move legacy encrypted contacts into D1: `cd studio && npm run migrate:contacts:d1`

## CI + Branch Protection

- CI runs lint, type check, tests, and build on pull requests to `main`.
- Branch protection is a GitHub repository setting (manual), not a code-delivered feature.
- Manual checklist is documented in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## Contributing and License

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- License: [`LICENSE`](./LICENSE) (MIT)
