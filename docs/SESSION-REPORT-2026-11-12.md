# Counterpoint Dispatch release and session record

Date: 12 November 2026, America/Toronto. This report covers the late-night Dispatch work following the 11 November Windows/mobile session. Earlier evidence is linked below rather than rewritten as if every step happened today.

**Approved outcome:** the owner selected Counterpoint, reviewed it on the local homepage, and explicitly authorized committing, pushing, merging to main and deploying. The final Dispatch surface uses the existing dark background, a single vertical title, a neutral story number and lilac word reveals. It does not repeat a static news list underneath the animation.

**Publication checkpoint:** local implementation, lint, typechecking and tests are complete. The full build is blocked at SEO postbuild; remote publication must still be observed. The agent shell cannot resolve GitHub or reach the npm registry; this is an environment/network limitation, not evidence of invalid credentials. Never infer a successful merge or deployment from a local build or commit.

## Baseline and prior session continuity

The local starting main commit is `a83d527a7fc54012f259e43c9f0a96883c6caf75`. Its history contains these merged changes:

| Change | Main commit / PR | Existing record |
| --- | --- | --- |
| Windows discovery, dark system and editorial changes | `90c1f88`, PR #52 | [Original session trajectory](SESSION-TRAJECTORY-2026-11-11.md), [Windows notes](WINDOWS-REDESIGN.md) |
| Mobile layouts, safe areas, search and later typography/reveal work | `0f38193`, PR #53 | [Mobile review](MOBILE-POLISH-2026-11-12.md), [Typography/reveal report](TYPOGRAPHY-AND-REVEAL-2026-11-12.md) |
| Cached handwritten signature hydration fix | `683875d`, PR #54 | [Signature report](SIGNATURE-HYDRATION-FIX-2026-11-11.md) |
| Compact movable world exit | `a83d527`, PR #55 | [Exit report](MOVABLE-WORLD-EXIT-2026-11-11.md) |

These are observed repository-history facts, not fresh deployment verification for each earlier release. Earlier documentation retains the status known at its original checkpoint.

The preceding conversation also produced a vector-based X banner and two sets of ten vector logo directions as separate exports. Threshold and Constellation were shortlisted; no replacement logo was selected for the application in this release. The AI chat idea and the DAX typography discussion remained proposals. No chatbot service, billing, mail setup, bot scheduler, or artist-owned website is changed here.

## Run-by-run trajectory

| Run | Request / decision | Work and result | Validation / evidence |
| --- | --- | --- | --- |
| 01 | Current Dispatch looked generic; explore Matrix-like type and colour locally | Six interactive directions: Phosphor, News Reel, Terminal Poster, Scan Index, Afterimage, Night Wire. Actual November 11 headlines, playback/static controls and width inspection. | 207 tests, lint and TypeScript passed; [comparison](review/dispatch-studies/six-directions.png), [390 px](review/dispatch-studies/mobile-390.png). One-pixel preview-header overflow at 360 px corrected. |
| 02 | Owner selected blue News Reel for the homepage | Typed headlines sliding vertically; full index below; hover/focus reading hold; original issue link and CMS source preserved. | Four transcript tests replaced/extended earlier coverage; 209 tests passed. A timer-boundary test expectation was corrected from 2480 to 2520 ms after blur. [Homepage reel](review/dispatch-studies/home-news-reel.png), [mobile](review/dispatch-studies/home-news-reel-mobile.png). |
| 03 | Box too tall, three Dispatch labels, repeated “independent” | Removed the duplicate index from animated mode; shortened the window; retained one title; moved All editions below; supporting copy now starts “A publication and directory for digital art.” | 209 tests passed; box reduced from about 583 to 330 CSS px at the checked desktop width; [compact homepage](review/dispatch-studies/home-news-reel-compact.png). |
| 04 | Colour should be in text, not the whole panel; six more ideas requested | Closed Captions, Reading Slit, Margin Note, The Running Line, Letter Relay, Counterpoint. Neutral panels/rules, compact heights, no duplicated index. | 209 existing tests passed; final prototype lint/typecheck passed. Longest headline checked at 360 px, no horizontal overflow; cards approximately 290–297 px. [Comparison](review/dispatch-studies-02/comparison.png), [360 px](review/dispatch-studies-02/mobile-360.png). |
| 05 | Owner chose Counterpoint for local homepage | Vertical title, large grey counter, lilac baseline word reveals; same #131315 background as the site. Widened the number column after visual review to prevent crowding. Removed reel measurement/translation code. | 209 tests passed; desktop and 360 px checks; 294 px card, 14 px counter/text gap on the checked mobile viewport. [Approved homepage](review/dispatch-studies-02/home-counterpoint.png). |
| 06 | Owner approved commit/push/merge/deploy and complete documentation | Release review, production client/SSR build, documentation consolidation, preservation of both prototype sets and evidence. | Client and SSR bundles built; SEO postbuild failed with `ENOTFOUND registry.npmjs.org` while resolving tsx and needs network-enabled completion. Remote CI/merge/deployment remain required. |

The [detailed design notebook](DISPATCH-DESIGN-STUDIES-2026-11-12.md) preserves the iteration checkpoints. The images above are real browser screenshots; this is not a continuous video or full keystroke recording. No retrospective recording is claimed.

## Final implementation

- `DispatchSection` reads the latest published edition from the existing `useDispatches` path. There is one visible Dispatch title in this section; the global navigation remains unchanged.
- `DispatchSignal` displays the current story position, date, one animated headline, a read-edition link and neutral progress marks. The whole surface opens the original local issue route.
- Animation reveals complete words from below their baseline. The duration scales with headline length, then holds for reading before advancing through every story and looping.
- Pointer hover and keyboard focus allow the current headline to finish and then hold it. Offscreen surfaces and hidden documents suspend progress. Reduced motion replaces animation with the complete static edition. Assistive technology receives a complete description without per-character live announcements.
- Text sizing is reserved in CSS; there is no new WebGL/canvas dependency for Dispatch. Existing Syne, Sora and IBM Plex Mono fonts are reused.
- The introduction removes the second “independent” at the owner's request. No other editorial content, archive dates, plates or CMS documents change.
- Archive and article pages, artist discovery, profile-before-world flow, automatic portal preview and movable Exit remain intact.

## Preserved local design studies

After starting the Vite dev server, visit:

- `/design/dispatch/` — studies 01–06, first-round concepts.
- `/design/dispatch-02/` — studies 07–12, text-colour-only concepts.

The corresponding HTML entries are in `design/`, React/CSS in `src/design/`. They are not imported by the public application and are not production build entries. The study data intentionally stays on the November 11 archive edition so comparisons are reproducible; the homepage uses the existing CMS/fallback path. Do not move these entries into `public/` or advertise them as live product routes.

## Verification and practical limits

- Lint, TypeScript and **209 tests across 30 files passed** on the final Counterpoint implementation.
- Updated transcript tests cover word reveal, advance/loop, correct issue destination, no duplicate animated-mode list, focus hold/resume, reduced motion and missing-item fallback.
- Local client build: `index-3KoNCufe.js`, 607.78 kB / 177.31 kB gzip. CSS: `index-Bn76zJ1D.css`, 117.46 kB / 21.82 kB gzip. SSR renderer: 1,428.16 kB. These are this checkpoint's outputs, not universal hashes for builds with different public environment settings.
- The existing >500 kB entry-chunk warning remains. This release does not suppress or claim to fix it.
- Complete `npm run build`, including SEO generation, is mandatory before upload. Client/SSR success alone is not enough.
- No physical iOS/Android hardware or lower-powered GPU benchmark was performed for this Dispatch pass. Viewport checks do not prove browser-toolbar behaviour on real devices.
- No dependency upgrades, vulnerability remediation, publishing-bot changes, CMS writes, schema deployment or email changes are included.

## Release ledger and alignment criteria

| Item | Checkpoint |
| --- | --- |
| User release approval | Explicit in this conversation, 12 November 2026 |
| Branch | `feat/dispatch-counterpoint` |
| Approved source + evidence | This branch's commit history; final screenshot linked above |
| GitHub push / PR | Pending network-enabled terminal operation |
| Required CI | Must pass on the actual PR head before merge |
| Merge | Squash through PR; protected `main` must not be bypassed |
| Local main | Must fast-forward to the merged GitHub `main` and be clean |
| Build | Must run the full build from that merged, clean main |
| Production target | Cloudflare Pages project `catalogue`, branch `production` |
| Deployment metadata | Must name the full merged Git SHA |
| Final evidence | Record PR URL, merge SHA, deployment ID/URL, production status and smoke-check results |

“Aligned” means clean local main equals a freshly fetched `origin/main`, Cloudflare's successful production deployment names that same commit, and the custom domain serves the expected assets and Counterpoint UI. A feature-branch upload, PR merge alone, or matching cached remote-tracking ref is insufficient. See [the deployment runbook](DEPLOYMENT.md#aligned-release-from-a-protected-main-branch).

When network operations finish, append observed identifiers/check results to the PR or release record. Keep this preparation checkpoint accurate rather than marking unobserved actions as complete.

## Follow-up: Dispatch arrival prototype

After the Counterpoint release preparation, the owner requested a local demonstration of a less abrupt editorial page opening. A distinct horizontal aperture now connects the homepage transcript to its edition, with a shared date and reduced-motion fallback. This is a **new, uncommitted local review**, separate from the approved Counterpoint release. See [prototype notes, screenshots and 213-test verification](DISPATCH-OPENING-PROTOTYPE-2026-11-12.md). At that checkpoint only Dispatch was changed; the later site-wide follow-up is recorded below.

## Follow-up: Constellation identity selected

The owner settled on logo direction 09, Constellation, and requested an immediate square export for X plus matching site icons/social thumbnails. Delivered a 2048 px PNG and SVG, replaced legacy logo assets, added SVG/PNG/ICO and device icons, wired a new 1200 × 630 branded default social card, and updated profile share-card generation/lookup to a new Constellation URL directory. Article imagery and historical Dispatch plates remain intact. See [identity masters, reproduction instructions and release status](BRAND-CONSTELLATION.md). This follow-up remains local pending release.

### Follow-up: Stories naming

Renamed the public Content Lab label to **Stories** in navigation, homepage editorial sections, footer, search, article links, and structured-data breadcrumbs. The initial label-only change was subsequently expanded at the owner’s request: `/stories/` is canonical, with permanent redirects from `/blog/`. Editorial history and stored author names remain unchanged. The private Content Lab workspace remains an internal tool.

## Follow-up: site-wide motion, sharing and legacy route cleanup

Owner feedback: extend Dispatch-like motion to the rest of the site, ensure all shared links have correct previews, rename Content Lab to Stories, remove Blog from the public experience and prevent the publisher byline from opening the old `/info/` surface.

Implemented a shared internal link transition with a restrained page reveal, a torn horizontal article opening and the existing Dispatch aperture. The header stays steady. Artist profile/world motion remains separate; modified clicks, external links, anchor jumps and reduced motion keep appropriate behavior. Slow route imports skip the snapshot rather than freezing navigation.

Moved the public story index/articles to `/stories/`, with server-side 301 redirects and local compatibility redirects from `/blog/`. Slugs stay identical, including `experimental-television-center-owego-paik-abe`. `/info/` redirects to `/about/`. The CATALOGUE byline now goes home. Removed public Blog type labels while retaining Interview tags and original CMS records.

Added consistent share metadata, route-change cleanup and a full-build share audit. Browser checks confirmed the supplied old article URL, query/hash preservation, the byline destination, About compatibility, Stories at 390 px without horizontal overflow, and no captured console errors. Screenshots and implementation/release limitations are in [navigation and sharing notes](NAVIGATION-AND-SHARING-2026-11-12.md).

This is local work; no new commit, push, merge or deployment occurred in this follow-up. Production alignment and live social recrawling remain release checks.

Validation completed: `npm run verify` passed lint, TypeScript and **224 tests in 33 files**. Client and SSR compilation passed with `npm run build --ignore-scripts`; the existing >500 kB client-chunk warning remains (612.48 kB minified / 178.95 kB gzip). This compilation intentionally excludes the network-backed SEO postbuild and is not a release artifact.

## Release authorization and network boundary

The owner approved completing checks/documentation and committing, pushing, merging and deploying this follow-up. Release preparation moved to `feat/stories-constellation`. During final review, fixed an alias-host redirect edge case so asset filenames do not gain a trailing slash; added regression coverage. Added a reproducible release handoff and production redirect/metadata/build-entry smoke check.

GitHub fetch/API failed DNS resolution in the agent shell. A fresh full build compiled the client and SSR successfully but failed postbuild while resolving tsx (`ENOTFOUND registry.npmjs.org`). This does not constitute a complete build, and no production upload was attempted with it. See [release checkpoint and remaining evidence](STORIES-CONSTELLATION-RELEASE.md). No claim of GitHub/main/production alignment is made at this checkpoint.

Final local verification before commit: lint, TypeScript and **225 tests across 33 files passed**. Release shell syntax and production-check script syntax passed. The full network-backed build remains blocked as recorded above.

## PR #57 validation and CodeFactor follow-up

The owner ran the complete release build in a network-enabled terminal. SEO generation succeeded for 320 profiles, 146 articles and 8 static routes. The share audit covered 502 pages and 321 local images; all 174 remote images were checked with zero failures (latest supplied audit: 2026-11-12T06:56:24.738Z).

Commit `0069d9a` was pushed to `feat/stories-constellation`; [PR #57](https://github.com/byLemonhaze/catalogue.gallery/pull/57) is open. GitHub's required **Lint, type check, test, build** job passed. CodeFactor reported two `no-duplicate-selectors` findings in `src/design/dispatch-studies.css`: `button` and `.poster-ghost`. Consolidated each selector's declarations without changing their effective styling. No check was bypassed.

The release script stopped at the failed quality check before merging or deploying. The corrected head must be pushed and pass checks; then the same release script resumes the protected-main merge, full build, deployment and alignment checks. Production alignment remains unverified.

Follow-up validation: lint, TypeScript and all 225 tests in 33 files passed. A PostCSS comparison confirmed unchanged effective declarations and no duplicate selectors within the same stylesheet context. Remote CodeFactor validation of the fix is pending push.
