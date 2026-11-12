# Windows redesign — review revision, 11 November 2026

Branch: `feat/windows-redesign`. Local review: http://127.0.0.1:5174/ (the user’s running Vite server).

These are chronological notes; earlier status statements describe their own review stage. The full build and branch push were subsequently completed and PR #52 opened. See the [session trajectory and release ledger](SESSION-TRAJECTORY-2026-11-11.md) for the consolidated decisions, final direction and evidence. No production deployment had been observed at that checkpoint.

## Motion and interaction

The carousel uses one native WebGL canvas containing subdivided image planes. A velocity-driven vertex shader bends the actual image perimeter and pixels; cursor interaction adds a local ripple, bounded parallax and shifting light, with restrained RGB separation near moving edges. This is a custom interpretation of the observed Unseen Projects motion, not a claim to use Unseen’s source or identical rendering pipeline. The existing Windows size/position interpolation is retained.

Vertical and horizontal wheel input over the stage controls the carousel. Ctrl-wheel browser zoom is left alone. Touch retains vertical page scrolling and horizontal swiping. A solid black range thumb replaces the arrow buttons. Autoplay advances approximately one artist per 8.5 seconds, pauses during manipulation, then resumes after 6.5 seconds of inactivity. Explicit Pause persists until Resume. Keyboard focus, an open modal, reduced motion, document visibility and offscreen state suspend autoplay. No whole-page smooth-scroll hijacking was added; the stage uses its own damped integrator.

Only adjacent cards mount. Textures are evicted after 12 seconds without use. GPU failure, texture failure and reduced motion retain real DOM images and links. Same-origin `/media/artist` delivery is restricted to public images from the existing Sanity project, with bounded sizes, no credential forwarding and cache headers. Local Vite provides the matching read-only CDN proxy. This resolved the cross-origin texture failure observed during browser testing.

Background labels hide as a unit when a higher-depth image covers them, fixing the stray next-artist label over the foreground artwork. Labels remain in the accessible links.

## Profile flow

First click opens a profile. A second click anywhere on its image, name, copy or empty card area enters the artist’s world. Close and explicit links retain their own actions, and text selection does not navigate. Keyboard users retain the native image link and Enter world link.

Profile images are flat DOM images with no WebGL renderer. Hovering or keyboard-focusing either the image or Enter world coordinates a restrained 3px image lift and button-square rotation. Dialog entry settles over 8px without scaling. Reduced motion disables these transforms and transitions. The landing carousel retains its shader. Selective framing remains available.

Profiles remain canonical `/artist/{slug}/` or `/gallery/{slug}/` pages with native dialog overlays when entered from discovery. Direct visits render full pages. Embedded worlds use the nested `/world/` route with noindex and the public profile canonical. No iframe mounts before entry. Exit restores the profile, and closing the profile restores discovery and focus.

## Content and typography

- Pure black and white, with the high-contrast display/Sora typography trial described below and IBM Plex Mono controls.
- Sidebar headline is the explicitly requested “A place to begin digital art in the independent world”. Production description is retained except for the explicitly requested removal of “Across mediums, platforms, and chains.”
- The sidebar’s duplicate Content Lab story is replaced by DISPATCH.
- Homepage stories form one feed; the separate editor-picks shelf is removed. The full archive is one All stories feed with no Article/Blog/Interview filters. Interview labels remain on interview cards.
- Production directory, Content Lab and application headings/copy are restored from base commit `bac7107`; invented promotional headings were removed. Article bodies and artist information are unchanged.
- Public link arrows were removed. Navigation remains actual links; underline and contrast provide affordances.

## Public biography contract

The optional `shortBio` field is reviewed public copy. Existing internal `contentBio` research is not projected publicly. The biography agent can deliver `{existing slug, shortBio, sources, review status}`. No placeholder biography is invented. The Studio schema must be deployed before the field appears in the hosted editor.

## DISPATCH contract

The dedicated `dispatch` schema, public archive/detail routes, historical backfill and site-first publishing contract are documented in `docs/DISPATCH-PUBLISHING.md`. The display uses verified historical editions plus published Sanity records. The external bot integration and production import await review.

## Validation and remaining release checks

Browser review used live Sanity data: 316 artists and 4 curated spaces. Confirmed actual GPU rendering and image deformation, wheel capture, label depth handling, flat profile images and coordinated entry feedback, whole-card world entry, Exit return, and a 390×844 mobile layout without horizontal overflow. Automated tests cover profile routing/focus, wheel cancellation versus browser zoom, label occlusion, DISPATCH rendering/link validation and the restricted image delivery endpoint.

Final verification passed lint, TypeScript and 175 tests across 24 suites. Run `npm run verify` to repeat these checks. `npm run build --ignore-scripts` compiles client and SSR bundles. The full network-dependent postbuild remains outstanding: the shell environment cannot resolve external endpoints or fetch the existing `npx tsx` runner. Partial `dist` output is not a release artifact. Studio dependencies are not installed in this checkout, so Studio compilation/deployment is also outstanding.

Before release: complete the network-enabled full build; build/deploy the Studio schema after review; verify the new image function on a Cloudflare preview, profile/world direct routes and fresh SSR data; then review motion on physical touch devices and lower-powered GPUs. Do not deploy this branch before the user’s design review.

## 11 November follow-up: directory, natural proportions, DISPATCH

- Removed the duplicate "Open official website" link from the artist card and the requested final sentence from the homepage introduction. The whole card and its image still enter the artist's world on the second interaction.
- Directory now sorts A–Z / Z–A / recently added / shuffle, with explicit reshuffle. `_createdAt` is projected in both client and SSR profile data. Shuffle rank survives filtering, grid/list changes and profile open/close; it resets on a fresh directory visit. Browser-verified on desktop and 390px mobile.
- Windows now fits original thumbnail proportions inside each animated slot. Sanity image dimensions provide the initial aspect; loaded intrinsic dimensions handle other images. Portraits, square and panoramic images stay uncropped; the mesh follows their measured rectangle. Caption occlusion and the existing velocity/cursor warp remain active.
- Typography review uses an installed Didot/Bodoni/Times high-contrast display stack for key titles and the already self-hosted Sora for reading/UI. This is a local art-direction trial, not a finalized cross-platform font selection. Apfel Grotezk and Le Murmure were researched; font download permission was declined, so no external font package was installed or bundled. Final display-font choice should be reviewed before release.
- DISPATCH has a searchable archive and dated issue pages, dedicated navigation, complete text, dated SEO metadata, structured data, static generation and public Pages routes. 30 selected daily editions / 164 stories / 120 images, after removing the five cover-only editions dated 6–10 October at the user’s request. All edition media appear in a staggered spread with a keyboard-accessible image viewer; verified November 11 plates also accompany stories 01, 03 and 05.
- See `docs/DISPATCH-PUBLISHING.md` for the source evidence, draft-only idempotent backfill command, remaining source/media provenance work and the site-first / approved-X-second handoff. No live Sanity writes or external bot configuration changes were performed.

## World controls

The Catalogue-owned world shell now uses white/black surfaces, Sora/IBM Plex Mono controls and the same serif display stack for fallback headings. Exit is a branded, high-contrast Catalogue / Exit world control with a CSS-drawn close mark. Existing per-artist placement and profile-return behavior remain intact. Loading and slow-load messages use a compact white branded notice, below the artwork on desktop and above the mobile exit. Missing-profile, connection and blocked-embed states share the same typography and button treatment. Artist iframe contents and sandbox permissions are unchanged. Browser-verified with Ryan Koopmans’s working embed and Burst’s known external-only fallback.

Landing DISPATCH and All editions share the same 2×2 cover/plate thumbnail, with the cover at top left. Enter world restores its 90-degree square rotation, coordinated with the quiet image lift; reduced motion remains respected.

## Landing density correction

The left discovery column is top-aligned: its prior flex centring against the growing sidebar caused the unintended white gap above the directory label/count. The original tagline stays in a smaller serif setting; the supporting paragraph is restored beneath it after the user confirmed the gap was the main issue. DISPATCH is now a compact, single edition link with the four-image collage, date and read affordance. Its repeated story headline and duplicate edition link are removed; All editions still opens the archive. Mobile uses a compact image/date row.

### Local review: Light, Night and Electric (11 November)
- Added a masthead colour selector. Light stays the default; Night uses charcoal and warm white; Electric uses deep violet with iridescent control/border accents. Artwork and artist-owned iframes retain their original colours.
- Preference persists locally, applies before first paint via `/theme-init.js`, synchronizes across tabs, and works in memory if storage is blocked. Server markup remains deterministic for hydration.
- Public typography now has two roles: system Didot/Bodoni/Times for page entrances and major headings, self-hosted Sora for reading and controls. This is still the local display-face trial, not a newly licensed font. Removed the unused public Syne preload; private publishing tools retain their fonts.
- Search, profile, application, legal and world controls share palette tokens. Fixed the old dark Apply panel/light-mode contrast mismatch. Electric hover changes respect reduced motion; the entry square rotation remains.
- Local preview only. No deployment or CMS publishing performed.

### Electric material and input follow-up
- Replaced the flat violet room with an actual WebGL reflective surface: moving folds, silver reflection bands and violet/cyan/pink thin-film colour. Chrome controls echo those reflections. Text surfaces retain a quiet backing; artworks are not filtered. Static metallic fallback if WebGL fails, reduced-motion still frame, capped resolution/30fps, hidden-tab pause, resource cleanup on theme changes.
- Removed decorative hover rings and mouse-focus rectangles. Keyboard focus uses a bottom rule; text fields retain an active underline. The square in Enter world still rotates.
- ArrowLeft/ArrowRight now step exactly one artist when the visible landing carousel or page has focus, including the fractional pointer scrubber. Keyboard focus pauses autoplay. Search, selects, text inputs, dialogs, modifier shortcuts and offscreen stages do not capture these keys.
- Browser verified paused carousel 01 → 02 → 03 via page/control arrows; Search mouse focus computed outline/shadow none. Regression coverage includes wraparound, slider focus retention and dialog/search exclusions.

### Current review: remove Electric; fit names; DISPATCH broadcast surface
- Electric was rejected and removed from the selector, palette rules and rendering code. Saved Electric preferences fall back to Light. Only Light and Night remain.
- Artist profile names now measure available column width and fit on one line; unusually long names may wrap only at whole-word boundaries, never inside a surname. Verified Armin Aschenbrenner at desktop and 390px phone width. Heading accessible names retain the exact complete artist name.
- Landing DISPATCH now uses a clickable glossy black broadcast surface instead of the four-image tile. Real headlines reveal in sequence, with a scanning reflection, subtle scanlines, a preview of the next headline and a progress rule. Hover/focus reveals the complete current headline and holds the sequence; pointer position moves the reflection and a slight physical tilt. Reduced motion presents a static complete headline. Hidden tabs/offscreen surfaces suspend the sequence.
- Only the on-site preview removes the mechanical “New on http://catalogue.gallery:” prefix; source editions remain unchanged. Archive four-image collages and full edition images remain in place.
- Verified the landing surface opens /dispatch/2026-11-11/. No deployment or CMS writes.

### DISPATCH refinement after review
- Replaced rounded tar edges with Catalogue's straight, square border and removed the floating drop shadow.
- All of the day's headlines are now visible together. A subtle reading highlight/progress rule moves through every story instead of hiding the other headlines behind a single-story ticker. The surface still has restrained moving light and pointer reflection; hover/focus holds the highlight.
- The complete headline list is available as the link description, without live-region announcements or repeated typewriter chatter. The serif/Sora system stays unchanged.

### Live DISPATCH typing and artist vortex preview — November 12

- DISPATCH now types each real headline character by character, retains completed rows, holds the complete bulletin for six seconds, then repeats. Hover/focus holds the completed edition; reduced motion shows the full bulletin immediately. Reserved line measurements prevent layout jumps; the accessible description contains the complete headlines without live letter announcements.
- Hovering or keyboard-focusing the profile image loads a non-interactive miniature of the artist's HTTPS website after a short intent delay. A custom WebGL spiral aperture pulls and twists the original artwork outward from its centre to reveal the actual iframe; leaving reverses the transition and releases the iframe after 900ms. Clicking retains the existing world route and return flow.
- Preview uses no autoplay, camera, microphone, forms or popup permissions. Known external-only profiles keep their artwork. Network error/timeout keeps the image. Reduced motion uses an immediate reveal; unavailable WebGL/CORS uses a fade. Cross-origin iframe load events cannot reliably diagnose every frame-policy denial; the existing known-blocked list remains the exclusion mechanism.
- Verified Jake Allen's live site in the preview and full world, plus reverse animation; screenshot: `docs/review/profile-vortex.png`. Targeted interaction/typing tests, ESLint, TypeScript and client/SSR build passed. No publication or deployment.

### Release audit — dark-only and quieter DISPATCH, November 12

This section supersedes the earlier Light/Electric and system-serif experiments above.

- The public site is dark-only from the initial HTML paint. Removed the theme picker and theme preference boot script. Self-hosted Syne is the display face for entrances/headings; Sora carries reading, captions and controls. Removed the Didot/Bodoni system-font dependencies. The original tagline and supporting paragraph are preserved.
- Landing DISPATCH uses a straight black panel with a faint gradient. Removed liquid sheen, scanlines and pointer tilt; live character-by-character headlines remain, followed by a complete-edition reading pause. Archive collages and original plates remain unchanged.
- Unified article typography, About surface/button, application contrast, search, legal dialog, missing-page state and world fallback/loading/exit controls. The legal dialog now has native modal focus containment, Escape and focus restoration. The editor entrance received readable labels and an accessible password name; authenticated publishing workflows were not exercised.
- Rechecked long artist names using the new face: Armin Aschenbrenner stays on one line at desktop. The image-to-world interaction, rotating entry square and vortex preview remain. Fixed the production image proxy to accept the bounded 1200px texture requested by the profile vortex (the development proxy had accepted it already).
- Desktop visual coverage: landing, directory, artist/gallery profiles, search, application including lower form, About/legal, Content Lab archive and article reader, DISPATCH archive/issue/image viewer, editor access screen, world blocked state, general missing page. Earlier world/preview interaction checks remain recorded above. Final homepage evidence: `docs/review/dark-home-transcript.png`.
- Responsive limitation: this audit's browser viewport override did not change the rendered dimensions. The new typography has not received a fresh mobile visual sign-off. Earlier 390px profile checks predate this final face change; do not treat them as approval of the new mobile rendering.
- Final verification: ESLint and TypeScript passed; all 186 tests across 27 suites passed, including the production image sizes and modal behavior. Client and SSR compilation succeeded. Full `npm run build` could not complete its postbuild step because the shell cannot resolve registry.npmjs.org to obtain tsx. GitHub and Cloudflare DNS are also unavailable to the shell. No deployment was attempted with the incomplete build. The existing main entry chunk exceeds Vite's 500kB warning threshold; route modules remain split.
- No live Sanity publishing, backfill, bot configuration, unrelated Lemonhaze changes or form submissions were performed.
