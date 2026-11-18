# Code-scanning triage — 18 November 2026

The original four CodeQL alerts (15–18) were fixed or removed in code and closed by the main-branch scan after PR 71. The PR analysis returned zero findings, but the first full main analysis since June subsequently reported ten additional findings on `d1808a7`. Each was traced using the SARIF paths from analysis `2198975061`.

The reported paths do not establish HTML injection in their current contexts. Editorial image URLs (24–27) have additionally been restricted to HTTPS or site-relative paths; the remaining contextual false positives are dismissed individually with the reasons below; no query, path or rule is globally disabled. Reassess if the input sources, rendering contexts or framework change.

| Alerts | Location | Evidence and disposition |
| --- | --- | --- |
| 19, 20 — incomplete sanitization | `functions/_lib/publicContent.ts:25`; `functions/stories/[slug].ts:7` | The first `{` in the compile-time `articleProjection` string is replaced with `{content, ` to add a GROQ field. This is query construction, not sanitization. No user value enters this replacement. The story slug uses the separate `$slug` parameter. Replacing every brace would change the query's meaning. |
| 21, 22 — incomplete multi-character sanitization | `src/lib/seo.ts:58`, `src/lib/seo.ts:64` | The regular expressions remove previously generated metadata/bootstrap elements from trusted, build-owned app-shell HTML. They are not used to sanitize user HTML. Untrusted metadata uses `escapeHtml`; JSON data replaces `<` with `\u003c` before insertion into a script data block. Existing SEO tests cover markup in titles, repeated metadata replacement and script-closing text in profile names. |
| 23 — DOM text as HTML | `src/components/ApplicationThumbnailField.tsx:35` | The SARIF source is a selected file. `src/hooks/useApplicationForm.ts:34–38` checks allowed image types and size, then uses `URL.createObjectURL(file)`. File contents or names are never used as HTML or as a constructed URL. The generated blob URL is assigned to a React image `src`. Existing submission tests cover file validation and object-URL revocation. |
| 24 — DOM text as HTML | `src/components/ContentLabSection.tsx:6` | JSON bootstrap data reaches an image URL through `previewImage`. React sets/escapes the `src` attribute; it does not reinterpret this value as HTML. Regression tests cover attribute-breaking text and explicit image-URL rejection. |
| 25, 26, 27 — DOM text as HTML | `src/components/DispatchMedia.tsx:16`; `src/components/DispatchThumbnail.tsx:5` | JSON bootstrap media URLs reach image `src` attributes in thumbnails, the contact sheet and the expanded viewer. All use ordinary React attributes, with no raw-HTML sink. Their shared media helper now rejects unsupported URL schemes before rendering. Tests exercise malicious quote/tag strings in the actual components, including expansion, and confirm there are no injected elements or event handlers. |
| 28 — DOM text as HTML | `src/pages/Dispatch.tsx:22` | The reported sink is the in-page link `href={\`#story-${item.number}\`}`. The fixed `#story-` prefix keeps it a fragment and React handles attribute escaping. A regression test supplies malformed runtime data containing quotes and `javascript:` text; the link stays on the current origin with no injected handler. |

The focused evidence lives in `src/__tests__/codeScanningTriage.test.tsx`, alongside `seo.test.ts` and `SubmitArtist.test.tsx`. These checks validate the actual rendering and data contexts; they do not make arbitrary HTML safe, and this triage is not permission to introduce raw-HTML rendering.

## Remaining Scorecard recommendations

Alerts 8 (independent code review), 10 (historical SAST coverage), and 11 (fuzzing) remain open. Scans now run on PRs, main and schedules; re-enabling them cannot retroactively cover historical commits. Independent reviewers and a fuzzing program are separate process decisions. These recommendations were not dismissed as false positives.

## Release verification

Every complete metadata build now writes `dist/release.json` from the source commit, preserving the deployment-identity endpoint previously produced only by the motion-release script. Production checks compare that commit with clean merged main, in addition to page and asset checks. Final scan state, deployment IDs and verification results are recorded on the remediation PRs.
