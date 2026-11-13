# Motion and interaction pass — 12 November 2026

Status: owner approved the local pass and explicitly authorized commit, push, merge to main and deployment on 12 November 2026. The local continuation has resolved the reported CodeFactor complexity findings and is proceeding through the protected release command. Final merge/deployment evidence belongs on PR #61; this pre-deployment document does not claim publication. Branch `feat/motion-interaction-polish` starts from the existing visual-tour documentation commit `f34a699`; that earlier commit is not this pass's publication.

## Approved brief

1. **Attached captions.** The carousel's artist caption should follow the artwork's bending edge, with readable text and a matching clickable surface. Keep the separate selected-artist name stable. Preserve accessible link names and non-WebGL/reduced-motion fallbacks.
2. **Alternating page reveals.** Alternate sideways and up/down centre-out reveals on ordinary internal navigation, with consistent timing. Preserve the independent artist portal and Dispatch aperture. Respect reduced motion and native link behaviour.
3. **Preview readiness.** Prevent the real website from flashing before its covering artwork or vortex is ready. Keep an opaque cover until the artwork has loaded/decoded and the render layer is prepared. Failures, slow loading, quick dismissal and switching artists must not expose unfinished previews.
4. **Drag and scrubber feel.** Offer local-only Baseline, Direct, Weighted and Free glide comparisons. Stop autorotation while held. New modes track the hand directly, then vary release momentum. The scrubber must track its actual chosen position without wrapping to the wrong side. Following owner review, keep the handle direct but restore a short fluid response in the artwork and a gentle release settle. Preserve touch page scrolling, pinch zoom, keyboard access and drag/click separation.
5. **Fresh discovery, stable return.** Shuffle once on a fresh document/refresh, including server-rendered visits, without a visible order swap or hydration mismatch. Keep order and selected position stable while navigating away and back within the app. Avoid persisting a stale initial lineup across reloads; keep the complete directory unchanged.

## Validation and review

- Add regressions for readiness races, cancellation, alternating directions, input mapping/momentum and discovery lifecycle.
- Run lint, TypeScript, tests and the complete build; distinguish client/SSR compilation from network-dependent postbuild completion.
- Check available local server responses and expose local comparison controls. Browser screenshots/recording depend on an available browser connection; do not claim visual checks that were not performed.
- Review on desktop and 390/360 px, including reduced motion, zero/one artist, long names and cached/slow assets. Physical phone/GPU testing remains separate.
- Record implementation decisions, verification outcomes and remaining limits here. Owner approval precedes commit/push/deployment and subsequent publication of the updated documentation.

## Investigation

- Carousel image deformation runs in WebGL while captions remain rectangular DOM strips.
- Drag and scrubber input currently share 160 ms easing; scrubber input is converted to the shortest cyclic path. Both reduce the feeling of direct control.
- Server-provided artist data bypasses shuffle, and carousel position initializes to zero. This explains repeated production openings independently of browser cache.
- The iframe becomes visible on its load event before artwork decoding and GPU first-frame readiness are coordinated. Existing CSS fallback state alone cannot establish that the cover has painted.

## Implementation and results

Implemented locally; no runtime changes published.

| Item | Local implementation |
| --- | --- |
| Attached captions | SVG text follows samples of the same bottom-edge deformation as the WebGL image. The wide rigid rectangle is removed in warped mode. A transparent SVG outline follows the image for pointer hit testing. Background caption occlusion uses the warped text bounds; full accessible link names and the separate selected name remain intact. |
| Alternating reveals | Ordinary page and Story transitions alternate horizontal/vertical expansion. Dispatch keeps its aperture and does not consume the next ordinary direction. Reduced-motion/API fallback visits remain immediate. |
| Preview readiness | The iframe remains hidden until its load event, artwork decoding plus a frame opportunity, and GPU first-frame readiness (or explicit fallback). The renderer initially paints a closed, opaque aperture. A stalled GPU texture falls back after ten seconds; failed artwork decoding never reveals the website. Preview source changes remount readiness state and cancel stale work. |
| Drag feel | Direct, Weighted and Free glide track input while held; Baseline retains the previous drag easing for comparison. Weighted is the provisional default. Release projection is bounded to 0.85 artists for Weighted and 2.5 for Free glide, with no momentum for stale gestures or reduced motion. The native scrubber accepts fractional positions along the actual track. Its handle follows the pointer immediately while the artwork follows with 65 ms easing, driving the existing velocity-based image/caption bend. Release settles to the nearest artist without a momentum throw. Keyboard arrows select whole artists; blur, cancellation and lost capture release the hold. |
| Discovery lifecycle | A per-App session shuffles the first client inventory, retains that order across renders/routes, appends new IDs without disturbing survivors, and remembers artist ID/fractional position/pause. Nothing persists the lineup across document reloads. SSR and initial hydration use the same inventory; the stage stays concealed until client order is ready, with a noscript visibility fallback. |

The local feel chooser is guarded by `import.meta.env.DEV`; its label/buttons are absent from the compiled client bundle. It appears below the homepage carousel as **Local review · drag feel**. These controls are for selecting the final interaction before release, not an added production preference panel.

## Review locally

Run `npm run dev -- --host 127.0.0.1 --port 5174` and open the port printed by Vite. If the terminal is already running, saved source changes update through Vite.

1. Drag artwork with each of Baseline, Direct, Weighted and Free glide. Compare immediate response, release glide, gentle stopping and the curved name. Click a name/image after the drag to confirm that the drag itself did not open a profile.
2. Scrub toward opposite ends of the track, then make small adjustments. Confirm the selected name/number and the handle agree. Use arrow keys while the scrubber is focused.
3. Open Directory, Stories, About and a Story in sequence. Ordinary reveals alternate sideways/up-down; an edition still uses Dispatch's own opening.
4. Open profiles repeatedly with cold and warm images, then dismiss quickly or switch artists. The live website must not flash ahead of the cover; reduced motion should reveal without a tear.
5. Reload home to get a fresh lineup. Browse elsewhere and return without reloading: the lineup, position and explicit pause should survive.
6. Repeat at 390 × 844 and 360 × 800; start vertical/diagonal scrolls on artwork, pinch zoom, release outside the stage and check long captions. Physical Safari remains a separate review.

## Slider follow-up after owner review

The owner found the revised slider too stiff despite accepting most of the five-item pass. Whole-artist stepping and zeroing the warp velocity had removed the fluid character. The follow-up restores continuous scrubbing (0.001 artist increments), a short 65 ms artwork response, and the existing warp/relaxation driven by actual movement. The handle stays at the chosen destination during release settling, avoiding a backward jump to the trailing artwork. The selection label reports the nearest visible artist as the artwork moves.

Release rounds only the destination, without extra inertia. Cancelling, losing pointer capture or leaving the browser follows the same settling path. Arrow keys remain whole-artist controls, including Up/Down on the focused slider. Existing artwork drag comparison modes and wheel behaviour are unchanged. A continuous carousel position is rebased when scrubbing starts, so accumulated rotations do not create a long trip backwards through previous cycles.

Review: drag the black handle slowly, reverse direction, jump across the track, then release between artists. The surface should bend during movement and relax when still; the thumb should remain responsive. This adjustment remains local pending visual acceptance.

## Verification checkpoint (initial five-item pass)

- `npm run verify`: lint and TypeScript passed; **241 tests across 36 files passed**. This includes readiness races/timeout/teardown, alternate-axis sequencing, direct scrubber positions, bounded release projection, drag cancellation/click suppression, in-app position/pause restoration, shuffle inventory stability and hydration without recoverable mismatches.
- The existing jsdom notice about document navigation remains; it did not fail the suite.
- Client and SSR compilation passed. Client entry: **618.61 kB / 181.12 kB gzip**; SSR bundle: **1,448.35 kB**. The existing >500 kB warning remains; its threshold was not changed.
- After consolidating the added CSS selectors, `npm run build --ignore-scripts` passed again. The compiled client excludes the local review control and the HTML retains the noscript visibility fallback. Documentation validation passed for 37 Markdown files and 317 local links/image references/heading targets; `git diff --check` passed.
- Full `npm run build` failed during SEO postbuild: npm could not resolve `registry.npmjs.org` to obtain `tsx` (`ENOTFOUND`). SEO generation/share audits therefore did not complete in this run. Run the complete build in the owner's network-enabled terminal before any later deployment; do not deploy this incomplete output.
- No browser screenshots or motion recording were produced: the browser connection is unavailable. Starting a server from the agent environment failed with `listen EPERM`; the owner reported starting the supplied Vite command. The agent could not independently connect to localhost from its environment. Local visual acceptance is therefore pending owner review, not asserted by the automated tests.

## Verification checkpoint (fluid slider follow-up)

- `npm run verify` passed: ESLint, TypeScript and **245 tests across 36 files**. New regressions cover fractional scrubbing, nonzero warp while moving, relaxation while held still, nearest-artist settling without overshoot, cancellation/lost capture/window blur, endpoints and Up/Down keyboard selection.
- The first focused test run exposed a test-fixture omission: its stage had jsdom's zero-size rectangle, so the existing offscreen keyboard guard correctly ignored arrows. Giving the fixture a visible rectangle fixed the test; the production viewport guard was preserved.
- `npm run build --ignore-scripts` passed client and SSR compilation. Client entry: **619.03 kB / 181.27 kB gzip**; SSR: **1,449.15 kB**. The existing chunk-size warning remains. This command intentionally excludes SEO postbuild; the earlier network-dependent postbuild limitation remains unresolved.
- `git diff --check` passed. No browser capture or independent visual confirmation was possible through the agent connection. The owner's running Vite server should pick up the saved changes for review at `http://127.0.0.1:5174/`.
- No commit, push, merge or deployment was performed.

## Remaining limits and release boundary

- SVG label and hit-area updates add per-frame work for the adjacent cards. Physical lower-powered-device performance and real Safari touch behaviour have not been measured.
- Captions remain vector text following a curved baseline, not rasterized text with the artwork's chromatic splitting. Long labels are fitted within their image width; the full selected name stays available below.
- Automatic previews still render one third-party website, and iframe load cannot certify complete third-party hydration or universally detect blocked embeds.
- A refresh creates a new random order, not a mathematically guaranteed different first artist every time. In-app memory lasts for the current mounted application, not across closed tabs/reloads.
- Owner approval for publication was received after the fluid-slider follow-up. The existing visual-tour commit remains separate history and is included in this branch. Remote merge/deployment evidence must come from the release command; local checks alone do not establish production alignment.

## Approved release preparation

The owner approved commit, push to main and deployment after local review. Release checks passed again: lint, TypeScript and all 245 tests. Client/SSR compilation succeeded, but the complete build again stopped at SEO postbuild because `registry.npmjs.org` could not resolve. Fetching GitHub and querying PRs also failed DNS in the agent environment. These are environment failures, not successful publication evidence.

The prepared command is `bash scripts/release-motion-polish.sh`. It preserves a clean working tree, integrates freshly fetched main, runs verification/full build/local and remote share audits, pushes the feature branch, creates the PR using the recorded description, waits for CI and CodeFactor on the exact pushed commit, and performs the protected squash merge without bypasses. It then fast-forwards local main, repeats verification/build/share audits, deploys to the configured Catalogue production branch and checks public routes/assets plus a source commit marker at `/release.json`. Final local/main/origin comparisons must pass. It stops on failure and can be rerun after resolving the reported problem. It does not create or move a release tag.

Publication status: prepared for a local commit and owner-terminal continuation. Do not infer a successful PR merge or deployment until the command prints its final verified alignment message. Browser and physical-device limits above remain applicable.

## Owner-terminal release attempt and continuation

The owner ran the release command successfully through authentication, verification (245 tests), the full build including SEO generation, and both share audits. SEO generation reported 320 profiles, 148 articles and 8 static routes. The local audit at `2026-11-12T20:41:02.332Z` covered 505 pages with no failures; the remote audit at `2026-11-12T20:41:31.075Z` checked all 177 remote images with no failures. The branch was pushed and [PR #61](https://github.com/byLemonhaze/catalogue.gallery/pull/61) was created for implementation commit `c8787963bfc4137a0e85fe82fa96e2fa69645f71` and its included visual-tour history.

The command stopped at failed CodeFactor while GitHub CI was pending. It had not reached merge or deployment. Exact CodeFactor findings were unavailable to the restricted agent session: GitHub API access failed and no browser-control connection was exposed, including subsequent retries. Existing stylesheet duplicates are only an investigative lead, not a confirmed diagnosis. The successful owner build supersedes the earlier environment-specific inability to finish postbuild; those earlier observations remain historical.

The owner requested a full handoff after another failed access retry. See [the local continuation brief](HANDOFF-MOTION-RELEASE-2026-11-12.md). The brief and this appended note are intentionally uncommitted handoff documentation; include them with the next fix commit before rerunning the clean-tree release command. No new runtime edits, merge, or deployment were made during handoff preparation.


## Local CodeFactor continuation (12 November 2026)

Local execution was confirmed in `/Users/lemonhaze/Desktop/CATALOGUE/catalogue.gallery`; the only initial changes were the intentional handoff and appended checkpoint above. GitHub returned PR #61 at `c8787963bfc4137a0e85fe82fa96e2fa69645f71`: CI had passed and CodeFactor had failed. Local preview access succeeded using the available elevated network permission; the owner's existing Vite process was reused.

The actual [CodeFactor check annotations](https://api.github.com/repos/byLemonhaze/catalogue.gallery/check-runs/131478242928/annotations) contain exactly these three **Complex Method** findings, using original source lines:

| File / original lines | Reported complexity | Correction |
| --- | --- | --- |
| `src/components/WindowsCarousel.tsx:70–99` | 20 | Separate fallback-caption occlusion, autorotation eligibility, position/memory updates and frame velocity from frame scheduling. |
| `src/components/WindowsCarousel.tsx:138–154` | 17 | Extract keyboard context guards while preserving editable-field, modal, inert, focus and viewport exclusions. |
| `src/lib/windowWarp.ts:99–177` | 24 | Separate texture lookup/loading, warped geometry and per-card drawing from the frame lifecycle. |

The linked CodeFactor website returned HTTP 403, but all three authoritative annotations were retrieved from its GitHub check run. No duplicate-selector finding was present; CSS was not changed. The refactor retains the exact easing, deformation, texture lifecycle, caption placement, draw order, discovery memory and input rules. No quality rule was suppressed.

Validation: ESLint, TypeScript and **245 tests across 36 files** pass after the final extraction. An additional local ESLint complexity check at a maximum of 15 passes for both edited files without changing repository configuration. The final local full build passed, generating 320 profiles, 148 articles and 8 static routes. The local share audit at `2026-11-12T21:14:38.020Z` passed for 505 pages and 321 local images; the remote audit at `2026-11-12T21:14:58.852Z` checked all 177 remote images with no failures. Client entry: `index-Da1bny8x.js`, 619.24 kB / 181.34 kB gzip; SSR: 1,449.83 kB. The full release command repeats verification, complete SEO build and local/remote share audits on the committed feature branch and again on merged main.

Chromium smoke checks on the existing local preview confirmed a WebGL renderer with loaded textures and six warped cards, whole-artist Left/Right keyboard input, fractional pointer scrubbing and nearest-artist settling. Desktop and 390 × 844 captures were inspected; evidence is retained as [desktop](review/motion-release/motion-release-desktop.png) and [390 px](review/motion-release/motion-release-390.png) screenshots. This is a targeted browser check, not a new design approval or physical Safari/GPU performance certification. Prior checkpoints describing unavailable browser access remain historical.

The handoff and original checkpoint are included with this correction. The updated PR description reflects the successful complete owner-terminal build and audits. Protected merge, deployment URL, source SHA and final production alignment will be recorded on the existing PR after those operations succeed, avoiding a source commit solely to describe its own deployment.


## Mobile swipe correction (13 November 2026)

After PR #61 shipped, the owner reported that carousel swipes failed on an iPhone 14 Pro in DuckDuckGo and browsers opened from X/LinkedIn. Browser touch input reproduced a small movement followed by a snap back: the touched artwork SVG path received implicit pointer capture, then lost it when the carousel stage captured the horizontal gesture. Its bubbling `lostpointercapture` event incorrectly cancelled the newly started swipe. This sequence follows the [Pointer Events capture handoff](https://www.w3.org/TR/pointerevents3/#process-pending-pointer-capture); the original handler treated every descendant loss as a stage loss.

`WindowsCarousel` now cancels for capture loss only when the stage itself is the event target and the pointer ID matches the active gesture. The existing horizontal-intent threshold, fluid motion, momentum, click suppression, vertical page scroll and pinch zoom are unchanged. Two regressions failed before the fix and pass afterward: descendant capture transfer must preserve the swipe; an unrelated pointer's capture loss must not cancel it, while actual stage capture loss still must. The test pointer fixture now retains pointer IDs.

Validation before publication:

- `npm run verify`: ESLint, TypeScript and **247 tests across 36 files** passed. The edited carousel still passes the additional local complexity limit of 15; repository rules were unchanged.
- Complete `npm run build`: 320 profiles, 150 articles and 8 static routes generated. Local audit at `2026-11-13T17:19:27.055Z`: 508 pages, 321 local images, no failures. Remote audit at `2026-11-13T17:19:49.746Z`: all 180 remote images checked, no failures. The content inventory increased through the existing CMS publishing workflow; this correction did not modify content.
- [Chromium browser touch input](review/mobile-swipe/chromium-touch.json), 393 × 852: a left swipe progressed continuously from artist 4 to 5; the reverse returned to 4. Vertical input over artwork scrolled the page by 113 px without changing the artist. The touch slider held a fractional 111.043 and settled to 111; pinch zoom reached approximately 3× and left no stuck drag; reduced-motion swiping and a normal profile tap passed.
- [WebKit iPhone 14 Pro profile](review/mobile-swipe/webkit-iphone14pro.json), 393 × 660 browser viewport: six loaded WebGL cards, no horizontal document overflow, and native touch tap opening the profile. [Screenshot](review/mobile-swipe/webkit-iphone14pro.png). WebKit checks covered rendering and taps; continuous swipe/pinch checks used Chromium touch dispatch.

These checks do not constitute a physical iPhone, DuckDuckGo, X or LinkedIn app session. The prior desktop mouse/viewport tests did not exercise implicit touch capture; the new regressions cover that specific gap. Deployment evidence will be attached to the follow-up PR after normal CI/CodeFactor checks, protected merge, main rebuild and production source verification.


## Restore the artist box after world exit (13 November 2026)

Historical PR #63 checkpoint: this implementation restored the website preview. The owner clarified that the return must show the original profile image; the correction below supersedes that behavior.

The owner requested that the vortex play on a fresh artist-box opening from CATALOGUE, but not replay after leaving the artist's world. Previously, navigating back remounted `WorldPreview` and created a fresh renderer without considering the route it came from.

A route-local navigation hook now recognizes a world → matching artist/gallery profile return before the profile mounts. Both modal and standalone profiles pass that return state into the preview. Returning previews allocate no vortex canvas and remove the fallback fade; they still wait for iframe load and decoded artwork readiness, preserving the no-flash and failure guards. Exit world, browser Back and repeated Forward/Back visits share this behavior, including a directly opened world. Closing the box and opening it afresh from CATALOGUE, opening another artist, or reloading a profile still permits the normal reveal. No persistent per-artist flag, new history entry, changed motion preference or iframe permission is introduced.

Validation: lint, TypeScript and **253 tests across 37 files** pass. Six added cases cover modal exit/fresh reopening, standalone artist/gallery history returns, direct-world exit, a different artist and restored-preview readiness. [Browser journeys](review/profile-return/browser-journeys.json) at 1280 × 900 and 393 × 852 confirmed a ready WebGL vortex on initial opening, zero vortex canvases and zero cover transition duration after Exit world, no vortex on browser Back, and a fresh vortex after closing/reopening. Third-party iframe documents were replaced with a controlled browser fixture so these checks isolate CATALOGUE's animation; real artwork and GPU rendering were used. These are desktop-browser checks, not physical-device certification.

The complete client/SSR/SEO build passed: 320 profiles, 150 articles and 8 static routes. Share audits passed for 508 pages, 321 local images and all 180 remote images (remote check `2026-11-13T19:07:37.110Z`). `git diff --check` passed.

This correction is prepared locally. It does not change the mobile swipe fix in PR #62. Publication and final source/deployment evidence require the follow-up release.


## Correct world return to the profile image (13 November 2026)

The prior change misunderstood the requested return state: suppressing the vortex while showing the website preview was wrong. The intended result is the artist's original profile image, with neither website preview nor vortex. The existing route-return classification is retained; `ProfileSurface` now disables preview creation for the entire returned visit. No iframe, cover overlay or GPU renderer is mounted on return, and the original clickable image remains visible. The image and Enter world still re-enter the artist's world. A fresh box opening from CATALOGUE retains the original vortex/readiness behavior.

The tests now assert the visible original image and absence of the preview subtree, rather than merely checking that animation is absent. The corrected assertions reproduced the mistake before the implementation changed. They cover modal and standalone artist/gallery returns, browser Back/Forward, direct-world exits, repeated image-based entry and fresh reopening. A timed surface regression verifies no preview appears later. ESLint, TypeScript and **253 tests across 37 files** pass.

[Corrected browser journeys](review/profile-return-image/browser-journeys.json) verified original image source, successful image loading, full opacity and zero preview iframes/portals after return at 1280 × 900 and 393 × 852. The [desktop](review/profile-return-image/returned-image-1280.png) and [mobile](review/profile-return-image/returned-image-393.png) returned-image screenshots were visually inspected. Clicking that returned image still enters the world; browser Back restores the image; closing and opening anew still creates a vortex. Third-party documents were controlled browser fixtures; actual artwork was loaded. This correction supersedes the earlier website-preview restoration and its assertions, while retaining that historical evidence.

Correction build validation: complete client/SSR/SEO build passed (320 profiles, 150 articles, 8 static routes). The local audit at `2026-11-13T19:18:13.086Z` passed for 508 pages and 321 local images; the remote audit at `2026-11-13T19:18:35.320Z` checked all 180 remote images with no failures. Final merged-main and production evidence will be attached to the corrective PR.
