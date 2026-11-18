# Credential audit and Content Lab retirement

## Finding and containment

A full-history audit found a real Sanity editor credential in the original committed `.env`, introduced on 8 February 2026 and removed from the working tree on 17 February. Removing the file had not revoked the credential. No credential value is reproduced here.

The exposed `VITE_SANITY_TOKEN` authenticated a read-only constant query on 18 November; an invalid-token control returned 401. Sanity's token inventory identified it as the project robot labelled `editor-private`, with the editor role. It was deleted at **19:35 UTC on 18 November 2026**, and the same historical credential then returned **401 Unauthorized**. The current administrator login was a different credential.

The website's `SANITY_WRITE_TOKEN` binding was replaced with a newly issued editor credential dedicated to website applications. It was transferred directly to Cloudflare's encrypted configuration without being written to source, logs or a temporary credential file. A read-only authentication check succeeded. Editor membership supplies the existing write permission; this audit did not submit a fake production application or send review emails.

The retired editor's three Cloudflare bindings (`CONTENT_LAB_PASSWORD`, `GROK_API_KEY`, `CLAUDE_API_KEY`) and GitHub password were removed, and its generation workflow was disabled before source removal. Other application/email settings were preserved. External bot credentials and provider accounts were not globally revoked merely because the website no longer uses them.

## Checks performed

- Official Gitleaks 8.30.1, checked against the release checksum, scanned all fetched branches, tags, pull-request heads 1–72 and local reflogs: **224 commits / 6.98 MB** at the initial audit checkpoint. The one credential above was the only finding before baseline suppression.
- A separate tracked-file snapshot scan found no credentials. Final source and built website scans are repeated before release. The website build scan covered approximately **299 MB** without findings.
- Text recognition ran locally on **73 tracked review screenshots**, with no recognition failures; scanning the extracted text found no credentials. OCR cannot guarantee recognition of every character.
- Historical filenames were reviewed for private exports, databases and key files. The SQL files found are schema migrations, not applicant-data exports. Current non-public email candidates were reviewed and were test fixtures or form placeholders; no applicant export was found.
- An additional read-only inventory checked 268 historical Cloudflare deployments. Seventy-one still served the retired API, one additional entry bundle contained the editor route, and 23 other entry bundles contained the same revoked historical token. These copies are scheduled for deletion after the replacement production deployment is verified; exact completion evidence belongs in the PR release comment. The historical token therefore was exposed in public website artifacts as well as Git.
- GitHub's secret-scanning API returned no alerts, even though the independent history scan found the Sanity credential. GitHub push protection is enabled; a clean GitHub alert page alone is insufficient evidence.
- Sanity management activity filtered to the exposed robot returned no events. This log covers project/management actions, **not document reads or edits**, so this result cannot rule out past access or misuse. See [Sanity's activity-log scope](https://www.sanity.io/docs/http-reference/activity-log).

The historical credential remains in old Git commits but is invalid. History was not rewritten or force-pushed. Revocation is the containment action; deleting a public commit cannot recover copies already downloaded elsewhere. See [Sanity's authentication guidance](https://www.sanity.io/docs/content-lake/http-auth).

## Prevention and regression coverage

The `Secret scan` workflow checks complete fetched history with default Gitleaks rules and an additional Sanity credential rule. Only the exact original revoked commit/path/rule/line is baselined in `.gitleaksignore`; new occurrences are not ignored. A synthetic credential committed in an isolated temporary repository failed the scan despite that baseline. The scanner executable is version-pinned and checksum-verified. `.dev.vars` files are ignored alongside `.env` files.

The [Content Lab retirement](legacy/CONTENT-LAB.md) removes the editor and six APIs. Tests verify HTTP 410 for retired paths/methods, rejection before assets/API/CMS access, deletion of the old browser-stored key without reading it, and preservation of active route handling. Local verification passed lint, application/server/script types and **280 tests across 40 files**. Website build, Studio typecheck, schema extraction and Studio build passed.

Final GitHub checks, required secret-scan protection, deployment IDs, removal of any surviving editor deployments, live route checks and merged-source alignment are recorded in the PR release comment after observation. Historical reports and screenshots retain their original context.

## Limits

No additional credential or private applicant export was found within the inspected material. This is not proof that the exposed editor token was never used by someone else, that all external logs are complete, or that no secret exists in unavailable forks, caches, downloads, external bot environments or unrecognized formats. No production dataset was deleted or rewritten as part of the investigation.
