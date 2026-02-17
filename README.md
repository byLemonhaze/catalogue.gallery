# CATALOGUE.gallery

Digital artist directory where each profile opens the artist's own website in an iframe "universe" and gives visitors a fast path back to browse more.

## Stack

- Frontend: React + TypeScript + Vite
- Content + review backend: Sanity Studio (`/studio`)
- Public API endpoints: Cloudflare Pages Functions (`/functions/api`)
- Email delivery: Resend
- Inbox/reply workflow: ProtonMail (via `reply_to`)

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
- `WEBHOOK_SHARED_SECRET` (for webhook authentication)
- `SANITY_PROJECT_ID` (optional server override)
- `SANITY_DATASET` (optional server override)

## Submission + Review Flow

1. User submits via `/submit`.
2. `POST /api/submit` creates a Sanity `artist` or `gallery` document with:
   - `status: "pending"`
   - optional `email`
3. You review in Sanity Studio:
   - pending list: `In Review (New)`
   - for fast workflow use document actions:
     - `Approve & Notify`
     - `Decline & Notify`
   - for declines choose `rejectionReasonCode` and optionally add `rejectionReason` details
   - for approvals optionally add `approvalMessage`
4. Sanity webhook calls `POST /api/webhook`.
5. `/api/webhook` sends approval/decline email through Resend.

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
   - URL: `https://catalogue.gallery/api/webhook`
   - Trigger: document create/update for `artist` and `gallery`
   - Projection body:
     ```json
     {
       "_type": _type,
       "status": status,
       "email": email,
       "name": name,
       "slug": slug.current,
       "websiteUrl": websiteUrl,
       "approvalMessage": approvalMessage,
       "rejectionReasonCode": rejectionReasonCode,
       "rejectionReason": rejectionReason
     }
     ```
   - Header: `x-webhook-secret: <WEBHOOK_SHARED_SECRET>`

This keeps deliverability high (Resend) while all replies route back to ProtonMail.

## Security Notes

- A previous committed `.env` exposed a token. Rotate that token in Sanity immediately.
- After rotating, update local and production env vars.
- If needed, scrub old secrets from git history before making the repo public.

## Useful Scripts

- Build app: `npm run build`
- Migrate old artists: `npx -y tsx scripts/migrate-artists.ts`
- Purge artists: `npx -y tsx scripts/purge-artists.ts`
