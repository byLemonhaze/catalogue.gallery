# Dispatch opening prototype

12 November 2026, America/Toronto. Local review only; no commit, push or deployment authorized for this new prototype.

## Direction

Following the Counterpoint transcript, the owner asked for page arrivals to feel less stiff, inspired by the artist profile's website tear. Proposed a distinct Dispatch signal aperture rather than repeating the organic vortex. Owner requested a local demonstration.

Clicking the homepage transcript starts a thin horizontal slit at the card's viewport centre. It extends across the screen, then opens vertically into the actual edition over 540 ms. The previous page dims and softens slightly; the date travels from the transcript into the edition header. The real destination is revealed, not a fabricated loading screen. Archive and Content Lab navigation are unchanged in this first prototype.

## Implementation and fallbacks

- `src/lib/dispatchOpening.ts`: native same-document View Transition with a callback that waits for the lazy edition route to commit. Repeated activation is ignored during the opening. A 900 ms bound skips the animation if route readiness is delayed, so a captured view cannot remain stuck over the page.
- `src/dispatch-opening.css`: scoped clip-path aperture and shared date; transient state is removed when the transition completes or fails.
- `DispatchSignal`: preserves ordinary href, modified-click and new-tab behaviour; unmodified click/Enter navigates with the opening.
- `DispatchIssue`: signals mounted route readiness. Reduced motion and browsers without the API use ordinary navigation with a 140 ms opacity arrival. Browser Back does not replay the aperture.
- No artificial pre-navigation delay, new dependency, editorial changes or CMS mutation.

## Verification

- `npm run verify`: lint, TypeScript and **213 tests across 31 files passed**.
- Four new tests cover unsupported API/reduced motion, matching-route readiness, duplicate activation, cleanup, slow-route timeout and refused transition startup.
- Live local browser: mouse and Enter navigation, real intermediate aperture screenshot, final edition arrival, Back to homepage, and 390 px viewport check (scroll width 390; no horizontal overflow; transient state cleared).
- [Desktop intermediate frame](review/dispatch-opening/aperture-desktop.png), [390 px arrival](review/dispatch-opening/arrival-390.png).
- Initial typecheck caught an optional CMS slug and nullable pending-route reference; both were corrected before the passing run.
- No physical mobile-device or lower-powered GPU performance measurement. Full production build/deployment is outside this local review pass.

Try it at `http://127.0.0.1:5174/`: click the Counterpoint transcript or its Read the edition label. Use Back to repeat. Review speed, expansion and date movement before extending the language to other editorial routes.
