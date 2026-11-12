# Motion and interaction pass — 12 November 2026

Status: owner approved the local pass and explicitly authorized commit, push, merge to main and deployment on 12 November 2026. Publication is pending the network-enabled release command, not claimed complete by this report. Branch `feat/motion-interaction-polish` starts from the existing visual-tour documentation commit `f34a699`; that earlier commit is not this pass's publication.

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
