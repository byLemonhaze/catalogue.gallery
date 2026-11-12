# A quieter, movable exit from artist worlds

The former top-right Catalogue/Exit world block could cover navigation inside
artist-owned websites, including Lemonhaze's menu. Replace it with one compact
Exit world link and a small grip. It is 140 × 44 CSS pixels on desktop and
140 × 48 on mobile, with a charcoal surface and one subtle border.

## Interaction

- Default placement: bottom-left desktop; bottom-centre at 760px and below.
- Drag anywhere on the control using a pointer or touch. Pointer capture keeps
  the gesture on the link when it crosses a third-party iframe.
- A 7px movement threshold separates a tap from a drag. The click after a drag
  is suppressed; a subsequent deliberate tap and keyboard activation still exit.
- Arrow keys move the focused control, Shift increases the step, and Home resets
  its position. Native link activation and the existing profile/back flow remain.
- Position persists in session storage across worlds. Fractional coordinates
  keep it inside safe-area bounds when the viewport changes size.
- The full bounds container uses pointer-events:none; only the small control
  receives pointer events, leaving the underlying website accessible elsewhere.

The legacy CMS exit-position values are preserved in data but no longer place
this control. Lemonhaze explicitly had top-right selected on both desktop and
mobile; retaining those values for placement would reproduce the reported issue.
Visitor movement now overrides the uniform safe default. CMS schemas and artist
websites were not edited.

## Validation

- `npm run verify`: lint, TypeScript and all 207 tests across 30 files passed.
- Four new tests cover tap jitter, pointer capture, drag bounds, release-click
  suppression, the next tap, keyboard movement, reset, saved positions, malformed
  storage and cancelled gestures.
- Client and SSR builds pass. Full SEO postbuild still needs the user's terminal
  network access before a production upload.
- Chrome desktop: top-right hit testing resolves to the artist iframe, not the
  Catalogue overlay; keyboard movement and returning to the profile verified.
- Chrome 390 × 844: control is 140 × 48 at (125, 784), within the 12px inset.
- After keyboard movement and resizing to 360 × 800, the control stays within
  the viewport. Screenshots are in `docs/review/movable-exit/`.
- Automated pointer tests passed. Native browser drag could not be independently
  confirmed in this session. Lemonhaze refused the localhost iframe, so its
  actual menu remains a production smoke check. No iframe security policy was
  weakened. Physical iOS toolbar and touch behaviour remain device checks.

## Release

Prepared on `fix/movable-world-exit`, based on merged signature fix #54
(`683875d`). No production deployment is included in this checkpoint. Push the
branch and open a PR; merge only after CI succeeds, then build and upload merged
main using the production instructions in DEPLOYMENT.md.

## Logo exploration

The user shortlisted Threshold (06) and Constellation (09). Ten additional
vector concepts (11–20) were exported separately, all with charcoal #131315 and
warm white #F3F1ED. No logo was selected or installed on the website or X account.
