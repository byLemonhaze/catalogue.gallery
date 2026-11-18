# Catalogue security and maintenance review

> Subsequent owner-authorized update: Content Lab has been removed, and a separate full-history audit found and revoked an exposed Sanity editor token. This report records the earlier review; use [the credential audit](docs/SECURITY-AUDIT-2026-11-18.md) and [retirement record](docs/legacy/CONTENT-LAB.md) for current status.

Reviewed 18 November 2026 against main `5130a59e695f636ec96f3994af29a56caa4c1e00`.

## Executive summary

GitHub reports 10 open code-scanning alerts: four CodeQL findings and six OpenSSF Scorecard findings. Both scanning workflows are currently `disabled_inactivity`. The latest CodeQL analysis is from 29 June 2026, and the latest Scorecard analysis is from 27 June, both on `db8c4ef264c1355dcfd29b669abf96f848c01096`. Their results do not describe current main reliably.

Three flagged code patterns remain, all in the retained legacy Content Lab. The fourth flagged component was removed. Several Scorecard findings concern process or historical dependency status. Dependabot currently reports **zero open alerts** after the dependency fixes.

Prioritize restoring current scan coverage and deciding whether to retire the legacy Content Lab. No critical exploit was established by this review. This is targeted source/configuration review, not a penetration test or assurance that all vulnerabilities have been found. The initial review was read-only apart from this report. The subsequent authorized implementation is recorded below.

## High-priority operational gap

### 1. Security scans stopped running

- Evidence: GitHub Actions workflow IDs `242743063` (CodeQL) and `242720992` (Scorecard) both return `state: disabled_inactivity`. Their files remain present and configured for main-branch pushes and weekly schedules.
- Impact: newly introduced code issues can escape automated review, while resolved issues remain displayed.
- Recommendation: re-enable both workflows, add manual dispatch so current main can be scanned on demand, and run fresh analyses. Confirm the analyzed commit before classifying or dismissing old alerts. Retain weekly and PR coverage.
- This is a monitoring gap, not proof of an exploitable website vulnerability. GitHub documents automatic disabling after 60 days of inactivity for public repositories: [workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).

## Current code findings

### 2. API key stored in browser session storage — medium contextual risk

- GitHub rates [alert 18](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/18) high.
- Evidence: `src/pages/ContentLab.tsx:620` reads the key; line 653 writes `window.sessionStorage.setItem(BYOK_SESSION_KEY, trimmed)`.
- Impact: scripts executing on the same origin can read a key entered in Content Lab. This is not evidence that a key is publicly exposed, and exploitation would need an additional condition such as script injection or compromised same-origin script.
- Recommendation: retire BYOK with Content Lab if unused. If retained, keep the key only in memory, remove previously stored values, and clear it when the editor is locked. Memory-only storage reduces persistence; it does not protect a key from a script already executing in the active page. Moving generation behind authenticated server-side credential handling is the stronger architectural option.

### 3. Website text extraction mishandles HTML — low contextual risk; two alerts

- GitHub rates [alert 16](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/16) and [alert 15](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/15) high.
- Evidence: `functions/api/content-scrape.ts:23` matches only a literal `</script>` closing tag; lines 29–31 decode ampersands before other entities. Thus script text with a closing tag such as `</script >` can survive extraction, and `&amp;lt;` can be decoded twice into `<`.
- Context: the function requires the Content Lab password at line 135. Extracted text goes into a model request at line 111, and the resulting research text is saved to Sanity at line 186. It is not directly inserted into browser HTML on this path. Public article rendering uses ReactMarkdown without raw-HTML processing (`src/components/ArticleView.tsx:96`). A public-site XSS exploit has not been demonstrated.
- Impact: unreliable research input and unsafe behavior if the helper is later reused as an HTML sanitizer.
- Recommendation: retire this endpoint with the editor, or use a proper HTML parser to discard unwanted elements and extract text with one decoding pass. Add focused malformed-tag/entity tests; never use this helper as a security sanitizer.
- References: [CodeQL HTML filtering guidance](https://codeql.github.com/codeql-query-help/javascript/js-bad-tag-filter/), [CodeQL decoding guidance](https://codeql.github.com/codeql-query-help/javascript/js-double-escaping/).

### 4. Legacy scrape query interpolates a request value — low contextual risk

- Evidence: `functions/api/content-scrape.ts:145` inserts `body.artistId` directly inside a quoted GROQ expression; line 140 checks only whether it is present.
- Impact: an authenticated caller can alter query structure. The existing password requirement limits exposure; no unauthenticated exploit or privileged-data disclosure was established.
- Recommendation if retained: validate the ID and use a GROQ parameter. Also apply URL validation, redirect checks and response-size limits to the outbound scraper (`content-scrape.ts:60–70`). These are follow-up hardening measures, not a claim that private-network access was demonstrated on Cloudflare.

## Historical and process alerts

| Alert | Current assessment | Recommended treatment |
| --- | --- | --- |
| [17 — DOM HTML injection](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/17) | `IframeTester.tsx` was deleted in `0f9f90e` / PR 44. No current copy was found. | Confirm closure in a fresh scan. |
| [12 — Vulnerabilities](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/12) | Historical list of 64 advisories; current Dependabot count is zero. | Refresh Scorecard against current lockfiles; investigate only remaining findings. |
| [13 — Token permissions](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/13) | `security-events: write` is still set at workflow level in `.github/workflows/codeql.yml:14`. | Move write permission to the analysis job that needs it. Small least-privilege improvement. |
| [10 — SAST coverage](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/10) | Historical partial scan coverage; workflows are now disabled. | Restore scanners and check current PR coverage. |
| [8 — Code review](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/8) | Main requires CI but zero approving reviews. | Decide whether independent reviewers are available. Do not introduce an unfulfillable self-review requirement merely to improve a score. |
| [6 — Maintained](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/6) | Old inactivity result; main now has recent maintenance commits. | Re-run Scorecard. |
| [11 — Fuzzing](https://github.com/byLemonhaze/catalogue.gallery/security/code-scanning/11) | No fuzzing integration detected. This is a testing recommendation, not an identified exploit. | Lower priority than current scans and focused input/parser tests. |

## Additional cleanup and improvement opportunities

### 5. Retire the unused Content Lab carefully

`docs/legacy/CONTENT-LAB.md:3` identifies the external bots → Sanity workflow as its replacement, but `src/App.tsx:141` still exposes Content Lab and the legacy APIs/workflow remain. Confirm current callers and preserve required drafts before removal. Remove obsolete UI, endpoint handlers and the manual generation workflow together. Keep shared D1 contact data, application handling and shared Sanity credentials intact. This could eliminate the three remaining flagged patterns rather than maintaining an obsolete editor.

### 6. Make server type checking explicit

`.github/workflows/ci.yml:35` runs the root TypeScript project, whose configurations include `src` (`tsconfig.app.json:27`) and `vite.config.ts` (`tsconfig.node.json:25`). There is no explicit project covering all Cloudflare Functions and build scripts. Some modules are transitively imported by tests, but this is incomplete coverage. Add a dedicated server configuration with appropriate Cloudflare types and check it in CI.

### 7. Lock the metadata-build tool version

`package.json:12` runs `npx -y tsx` during every build, and line 13 does the same for the migration script. `tsx` is not a declared root dependency. Add it as a locked development dependency and invoke the local binary, making clean builds reproducible rather than resolving an undeclared tool from the registry/cache.

### 8. Stop tracking generated Studio runtime files

`studio/.sanity/runtime/app.js:2` explicitly says it is autogenerated and edits are discarded. Both it and `index.html` are tracked, while `.gitignore` has no `.sanity` entry. Remove generated runtime files from version control and ignore the directory after confirming a clean Studio build regenerates them.

### 9. Require the Studio check before merging

GitHub main-branch protection currently requires only `Lint, type check, test, build`. The new `Studio build` job exists (`.github/workflows/ci.yml:47`) but is not required. Add it to required checks after verifying the exact check name on current runs.

### 10. Consolidate response security headers; stage a CSP

The live homepage returns `nosniff`, SAMEORIGIN framing protection and a referrer policy. It does not return a Content Security Policy or Permissions-Policy. `public/_headers:5` specifies Permissions-Policy, but `functions/_lib/seoResponse.ts:10` creates its own response headers without it. Centralize appropriate headers for static and function-generated responses. Introduce CSP in report-only mode first and test artist embeds, images, Sanity and inline scripts before enforcing it. This is defense in depth, not evidence of an active compromise.

### 11. Close superseded maintenance PRs after comparing their changes

Old dependency PRs 32 (tar), 35 (undici) and 36 (Vision 5.x) predate the consolidated dependency remediation and appear superseded. Confirm each diff, then close obsolete ones with a reference to PR 66. Keep new grouped updates and unrelated feature proposals separate; do not mass-merge or mass-close them.

## Suggested implementation order and verification

1. Restore scanners, add manual dispatch, scope workflow permissions, and obtain fresh results.
2. Confirm Content Lab usage. Retire it if unused, otherwise fix key persistence, parsing and query handling.
3. Lock build tooling, add server type checking, ignore generated Studio files, and require the Studio check.
4. Address header consistency and carefully test a report-only CSP; clean up superseded PRs.

Run existing lint, type checks, tests, website build and Studio checks after implementation, plus targeted tests for any retained legacy handlers. Validate fresh scan commit IDs and public-route/embedding behavior before deployment. The public site's design need not change. Retiring Content Lab intentionally removes that legacy editing interface; key-storage changes would require users of that editor to re-enter their key after reload.

Review evidence: authenticated GitHub alerts, analysis/workflow and branch-protection APIs; current source; deletion history; and a read-only production homepage header request. No production content, credentials or data were changed.

## Authorized remediation

Implemented: workflow reactivation and manual dispatch; job-scoped CodeQL permissions; in-memory BYOK keys with removal of old stored values; parser-based research extraction; bounded/validated website fetches; parameterized artist lookup; explicit Functions/script type checks; locked `tsx`; ignored generated Studio runtime; shared response headers and a report-only CSP. The expanded type checks also corrected an outdated wildcard-topic annotation and explicitly mapped public build environment fields.

Superseded dependency PRs 32, 35 and 36 were closed after confirming installed undici 7.30.2, tar 7.5.23 and Vision 6.24.0 exceed their requested updates. The Studio check was added to main's required checks. Final CI, scanner and deployment evidence belongs in the remediation PR's release record.

Content Lab is retained and hardened pending confirmation of usage. No production data or credentials are deleted. Independent-review and fuzzing recommendations remain lower-priority process decisions. CSP remains report-only until browser observations justify enforcement.

The first refreshed full main scan closed the original four CodeQL findings and surfaced ten additional warnings. Editorial image URLs were further restricted; contextual false positives, including one additional image-path warning from that hardening, were triaged individually. Their source/sink analysis, regression evidence and dismissal rationale are documented in [Code-scanning triage](docs/CODE-SCANNING-TRIAGE.md). Scorecard's three process recommendations remain open.
