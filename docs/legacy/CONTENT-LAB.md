# Content Lab retirement

Removed on 18 November 2026 at the owner's request. Editorial publishing continues through external bots → Sanity → Catalogue; see [Editorial publishing](../EDITORIAL-PUBLISHING.md).

The private editor, its React route, six API handlers, prompt/parser/scraper helpers, BYOK model integration, generation workflow and editor-only styles have been deleted. Public Stories and Dispatch continue to use the shared editorial cards. The website no longer calls xAI or Anthropic.

`/content-lab`, all its subpaths and `/api/content-*` return **410 Gone** for every HTTP method, before static fallback or API handling, with noindex and no-store headers. Startup removes the previous browser session-storage key without reading it.

The manual GitHub generation workflow was disabled and its password removed. Website production bindings `CONTENT_LAB_PASSWORD`, `GROK_API_KEY` and `CLAUDE_API_KEY` were removed. The website application endpoint now has its own newly issued Sanity credential. Credentials belonging to external bots are outside this retirement; project bindings were removed without revoking potentially shared provider accounts.

Historical D1 `content_drafts` records and migration `003_content_drafts.sql` are preserved, with no remaining application handler exposing them. Existing Sanity research fields are hidden and read-only in Studio to preserve stored documents without an active editor feature. Published posts, applicant contacts and the shared D1 database are preserved. This retirement does not erase historical data or rewrite Git history.

The old local article import remains maintenance-only: `npm run migrate:articles` uses `createOrReplace` and can overwrite CMS edits. It must not be run as a routine content refresh. Old screenshots and dated reports describe their original checkpoints.

See [the credential audit](../SECURITY-AUDIT-2026-11-18.md) for the separate historical secret discovery, revocation and verification limits. Final merged commit and production deployment evidence belong in the PR release comment.
