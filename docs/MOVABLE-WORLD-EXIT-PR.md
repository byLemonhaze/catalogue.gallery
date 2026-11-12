The old fixed top-right Catalogue/Exit block obscured artist navigation, including Lemonhaze's menu. Replace it with one compact dark Exit world control, initially bottom-left on desktop and bottom-centre on mobile.

> **Historical checkpoint.** This record preserves the decisions, terminology, screenshots and verification status at that stage. Pending/local-only release statements and old commands are not current deployment instructions. Use the [documentation index](README.md), [current publishing guide](EDITORIAL-PUBLISHING.md) and [reconciled audit](DOCUMENTATION-AUDIT-2026-11-12.md) for current context.

Visitors can reposition it with pointer/touch or keyboard. Position is remembered for the session and remains inside safe-area bounds after resizing. Dragging suppresses accidental exit; ordinary clicks retain the profile-before-world return flow. The surrounding positioning layer passes input through to the artist iframe. Legacy CMS placement values remain stored but are superseded by this new default and visitor preference.

Validation: lint, typecheck and all 207 tests pass, including new gesture, persistence, reset and cancellation coverage. Client/SSR build passes. Browser checks cover desktop hit areas, exit navigation, and 390/360px layouts. Physical iOS touch and Lemonhaze's production menu remain smoke checks because that site rejected the localhost iframe during review.

See docs/MOVABLE-WORLD-EXIT-2026-11-11.md and docs/review/movable-exit/ for evidence. Full SEO generation must complete before the production upload.
