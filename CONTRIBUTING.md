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
- Use GitHub Issues for public bugs and feature requests:
  - bug reports: `Issues` / the bug-report issue form
  - enhancements: `Issues` / the feature-request issue form
- Report vulnerabilities privately via [`SECURITY.md`](./SECURITY.md) instead of opening a public issue.
- Keep issue descriptions, commit messages, pull requests, and repository docs in English.

## Required Checks

Before requesting review, run:

1. `npm run verify`
2. `npm run build`

PRs to `main` are protected by required CI checks.

## Code Standards

- Prefer TypeScript-safe changes over `any`.
- Keep API contracts explicit and documented in `docs/API.md`.
- Update docs when behavior or operational setup changes.
- Treat lint failures, type errors, and other verification warnings as merge blockers unless a PR explains a deliberate exception.

## Releases

- Public repository releases use Semantic Versioning (`v0.x.y` until the project is ready for `1.0.0`).
- User-visible changes should be reflected in [`CHANGELOG.md`](./CHANGELOG.md).
- GitHub release notes should summarize major behavior, operational, or security changes in plain language.

## Test Policy

- New user-facing behavior, API behavior, and data-processing logic should include automated tests whenever practical.
- If automated coverage is not practical, explain why in the pull request.
- Run `npm run verify` before opening or updating a PR.
- When a change affects a documented interface or workflow, update the relevant docs in `README.md`, `docs/API.md`, `docs/QUALITY.md`, or `docs/DEPLOYMENT.md`.

## Security and Secrets

- Never commit secrets (`.env`, `.env.local`, API tokens, keys).
- Use Cloudflare environment variables/secrets for runtime credentials.
- Treat contact/email data as sensitive; preserve encrypted-at-rest behavior.
