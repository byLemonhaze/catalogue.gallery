# Contributing

Thanks for contributing to `catalogue.gallery`.

## Development Setup

1. Install dependencies:
   - `npm install`
   - `cd studio && npm install`
2. Configure env:
   - `cp .env.example .env.local`
3. Run app:
   - `npm run dev`

## Branching and PRs

- Create a feature branch from `main`.
- Open a PR back to `main`.
- Keep PRs focused; avoid unrelated refactors.

## Required Checks

Before requesting review, run:

1. `npm run lint`
2. `npm test -- --run`
3. `npm run build`

PRs to `main` are protected by required CI checks.

## Code Standards

- Prefer TypeScript-safe changes over `any`.
- Keep API contracts explicit and documented in `docs/API.md`.
- Update docs when behavior or operational setup changes.

## Security and Secrets

- Never commit secrets (`.env`, `.env.local`, API tokens, keys).
- Use Cloudflare environment variables/secrets for runtime credentials.
- Treat contact/email data as sensitive; preserve encrypted-at-rest behavior.
