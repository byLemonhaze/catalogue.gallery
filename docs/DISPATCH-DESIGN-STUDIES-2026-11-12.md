# Dispatch box: six local studies

Status: the owner approved final Counterpoint and authorized commit, push, merge and deployment on 12 November 2026. Earlier statuses below are chronological checkpoints. See [the session report](SESSION-REPORT-2026-11-12.md) for the consolidated release ledger.

## Request

Make the homepage Dispatch box more original, with Matrix-like terminal typography and restrained coloured text. Compare several directions before integrating one. Preserve the dark Catalogue system, actual editorial content, and the rest of the homepage.

## Review

Run the existing Vite development server and open http://127.0.0.1:5174/design/dispatch/.

The review page has six animated, clickable studies, an individual inspection mode, 320/360/390/460 px box widths, pause, replay, and a static full-text view. It uses the November 11 edition from the local archive for consistent comparisons. It is deliberately not a live CMS feed.

1. Phosphor: green uppercase mono, subtle screen texture, typed transcript.
2. News reel: ice blue, vertical moving transcript with a fixed reading position.
3. Terminal poster: acid yellow, large typed headline and full contents index.
4. Scan index: celadon, highlighted reading row in a complete numbered index.
5. Afterimage: violet text, thin margin and fine cursor; no iridescence.
6. Night wire: amber indented messages on a continuous vertical rule.

All use existing local fonts. No external fonts, images, shader dependencies or generated imagery added. Offscreen and hidden-tab typing pauses; reduced-motion preferences disable animated typing. Every box links to the same original edition. The accessible text includes all headlines without announcing every typed character.

## Isolation

`design/dispatch/index.html` is an independent development entry. Its React/CSS modules in `src/design/` are not imported by the application or added to the production build inputs. No changes to the homepage component, DispatchSignal, CMS, archive, world flow, or site-wide typography.

## Validation

- `npm run verify`: lint, TypeScript and all 207 existing tests passed.
- Browser checked at desktop, 390 px and 360 px. No card/text overflow; a one-pixel review-header overflow at 360 px was corrected and rechecked.
- Focused box-width selector, pause, replay, static text, and direction selection exercised.
- A box click opened the correct November 11 edition.
- Screenshots in `docs/review/dispatch-studies/`: full comparison and 390 px comparison.

These are selection prototypes. Final homepage proportions, full-cycle motion tuning, keyboard/accessibility details, and tests for the chosen production implementation follow approval. No mobile hardware or lower-powered-device performance claims are made from browser viewport checks.

## Next

Select a direction or combination. Integrate and review it on the local homepage. Only after approval: verify, commit on a feature branch, PR/checks/merge to protected main, sync local main, build and deploy that exact commit, then verify production alignment.

## Selected direction: local homepage trial

The user chose the blue News Reel. `DispatchSignal.tsx` and `dispatch-signal.css` now render it on the local homepage, using the existing Dispatch feed and original edition link. Headlines type in sequence and slide vertically; a complete contents index stays readable underneath. Hover/focus finishes the current line and holds it for reading. Reduced motion shows the complete static index without the moving window. Full-line measurements keep the reading window stable across typing and adapt to headline lengths and width.

Updated interaction tests cover the complete typing/advance/loop cycle, focus hold/resume, reduced motion, and editions without structured items. `npm run verify` passed lint, typecheck and all 209 tests. Browser checks passed at desktop, 390 px and 360 px with no horizontal page overflow or clipped headline rows. Review screenshots: `home-news-reel.png` and `home-news-reel-mobile.png` in the same review folder.

The earlier isolation notes describe the six-study comparison page; the selected trial now intentionally modifies the local homepage. Nothing has been committed, pushed or deployed.

## Compact revision after homepage feedback

Removed the duplicate static index from the animated version, reduced the reel window to 168 px (with measured expansion for longer headlines), and moved All editions below the box. The repeated outer Dispatch heading and explanatory sentence are gone; only the blue title inside the box remains. The introduction now begins “A publication and directory for digital art.” The headline retains “independent world.”

The reduced-motion version still provides a static list instead of animation, and all headlines remain accessible through the link description. At the checked desktop width the box fell from about 583 px to 330 px tall. Desktop and 360 px viewport checks showed no clipped headline rows or horizontal page overflow. Lint, typecheck and all 209 tests passed. Latest screenshot: `docs/review/dispatch-studies/home-news-reel-compact.png`. Still local only, pending approval.

## Second round: colour belongs to the text

The user clarified that the blue panel itself was unwanted and requested six more surprising local studies. Added the independent preview `/design/dispatch-02/`, with neutral surfaces and rules, colour restricted to transcript typography, one Dispatch masthead per design, and no repeated static news index.

07 Closed captions: centred word-by-word captions, pale citron reading word.
08 Reading slit: compact scrolling mono transcript, ice-blue text on neutral black.
09 Margin note: vermilion italic sentence alongside a neutral story number.
10 The running line: oversized mint horizontal news ribbon with holds at both ends.
11 Letter relay: amber mono characters turning into place, without physical tiles.
12 Counterpoint: vertical masthead, neutral counter and lilac baseline word reveals.

Preview controls offer individual inspection, width selection, pause/replay, complete-text freeze, and a selector for any of the five real November 11 headlines. Motion stops offscreen, in hidden tabs, on hover/focus, and for reduced-motion users. The horizontal direction wraps fully when static. Accessible descriptions retain the complete edition.

Validation: all 209 existing tests passed; final preview changes passed ESLint and TypeScript. Browser reviewed at desktop and 360 px with the longest headline selected; no horizontal document/card overflow. All six cards measured roughly 290–297 px tall at 360 px. Horizontal movement, selection controls and freeze/animate were exercised. Screenshots: `docs/review/dispatch-studies-02/comparison.png` and `mobile-360.png`.

This round does not alter the local homepage trial or any production component. No commit, push or deployment. Awaiting a selection.

## Counterpoint selected for homepage trial

The user selected 12 Counterpoint. The local homepage now has a vertical Dispatch masthead, neutral large story number, lilac word-by-word baseline reveals, neutral progress marks and no tinted panel or duplicate index. The background matches the site's #131315. Hover/focus allows the current headline to finish and then holds it; reduced motion uses the complete static edition. The existing concise intro and one-title treatment remain.

Removed the reel translation/measurement implementation; headline sizing is reserved with CSS. Enlarged the number column after browser review to avoid crowding two-digit counters. Browser verified desktop and 360 px (294 px card height, 14 px counter/text gap, no horizontal overflow). Lint, typecheck and all 209 tests passed, including updated word-reveal cycle tests. Screenshot: `docs/review/dispatch-studies-02/home-counterpoint.png`.

Current status: local review only. No commit, push, merge or deployment.

## Release authorization

After the Counterpoint homepage trial, the owner explicitly approved commit, push, merge to main and deployment, with all documentation and session history preserved. The [release/session report](SESSION-REPORT-2026-11-12.md) consolidates the approved state and records remote verification separately from local preparation.
