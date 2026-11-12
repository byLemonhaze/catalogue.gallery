# Catalogue finishing pass — typography and automatic world invitation

Branch: `feat/mobile-polish`. This follows the mobile pass in PR #53. The owner said “mobile is good now” and asked to finish the remaining items. That is recorded as owner acceptance, not a claim that the agent tested physical Safari devices.

## Completed

- Tested and retained a handwritten `.gallery` header treatment for review. Caveat 600 is rendered as a 10,154-byte SVG wordmark; the full 394 KB font is not shipped. Only the header suffix changes. Sora is visible until the asset loads, and remains if it fails. Accessible home-link text is preserved. License, provenance and a macOS reproduction script are included.
- Established an explicit Plex Mono control-font token. Public navigation, buttons, selects, action links, form labels, carousel controls, editorial metadata, Dispatch controls and world-entry/exit controls now use it. Syne remains the display voice; Sora remains the reading face. Private publishing tools retain their styling.
- Changed the profile website preview from hover-triggered to automatic. The card paints first, then loads one HTTPS preview. The iframe load event starts the tear; leaving the image no longer reverses it. Clicking the image or Enter world still explicitly opens the full world. Closing/leaving the profile removes the preview.
- Kept the known external-only exclusion list, sandbox, disabled autoplay/camera/microphone and noninteractive preview. No preview is emitted by server-rendered profiles. Errors and the 10-second timeout keep the artwork. Reduced motion shows the loaded preview without the tear.
- Prevented a fast iframe from flashing through before the vortex texture is ready. Failed WebGL/texture loading falls back to the non-WebGL transition.

No light/electric mode, editorial-copy rewrite, Dispatch-plate regeneration, CMS mutation or deployment is part of this change.

## Visual checks

Actual Chrome captures, not physical-device simulations. No horizontal document overflow was observed on the checked surfaces. The 360 px directory retains its separate grid/list row; navigation stays on one row with 44 px targets. Armin Aschenbrenner fits on one line and Enter world remains a 56 px target. Search remains readable at 360 px.

| Surface | Evidence |
| --- | --- |
| Header/home before, 390 × 844 | [Before](review/typography-polish/home-before-390.png) |
| Header/home after, 390 × 844 | [After](review/typography-polish/home-after-390.png) |
| Header/home desktop | [Before, 1512 × 802](review/typography-polish/home-before-desktop.png) / [After, 1512 × 746](review/typography-polish/home-after-desktop.png) |
| About, 390 × 844 | [Capture](review/typography-polish/about-after-390.png) |
| Dispatch archive, 390 × 844 | [Capture](review/typography-polish/dispatch-after-390.png) |
| Directory, 390 × 844 and 360 × 800 | [390](review/typography-polish/directory-after-390.png) / [360](review/typography-polish/directory-after-360.png) |
| Search and Apply, 360 × 800 | [Search](review/typography-polish/search-after-360.png) / [Apply](review/typography-polish/apply-after-360.png) |
| Long-name profile, 360 × 800 | [Capture before automatic-reveal change](review/typography-polish/profile-after-360.png) |
| Known blocked world, 360 × 800 | [Capture](review/typography-polish/world-blocked-after-360.png) |
| Content Lab/article/edition, desktop | [Content Lab](review/typography-polish/content-lab-after-desktop.png) / [Article](review/typography-polish/article-after-desktop.png) / [Edition](review/typography-polish/edition-after-desktop.png) |
| Automatic preview, desktop | [Lars Wander website revealed without hover](review/typography-polish/profile-auto-reveal-desktop.png) |

The automatic preview was observed with `data-open=true`, iframe loaded and WebGL canvas ready, without moving the pointer over the artwork. Clicking the image entered `/artist/lars-wander/world/`; Exit returned to the profile. Screenshots document endpoints, not the timing of the moving tear.

## Validation and limits

- `npm run verify`: lint, typecheck and **201 tests across 29 files passed**.
- New/updated tests cover accessible logo fallback, navigation, automatic preview preparation, opening on load, persistence after pointer leave, teardown, error/timeout, insecure URLs, immediate dismissal and reduced motion. Existing static-render and full profile/world flow suites pass.
- `npm run build --ignore-scripts`: client and SSR builds passed. Entry 607.45 KB (177.19 KB gzip); SSR 1,424.13 KB. Existing chunk warning remains.
- `npm run postbuild`: blocked by npm DNS (`ENOTFOUND registry.npmjs.org`); offline attempt also confirmed `tsx` is not cached. Run the complete `npm run build` in the owner's network-enabled terminal before deploying this revision. The owner's earlier successful SEO build applies to the preceding mobile commit, not this new build.
- Physical Safari toolbar/keyboard behavior and lower-powered-device FPS/battery use have not been independently measured. Automatic preview now contacts and renders the selected external site even without hover, adding one site's cost while its card is open. Reduced motion removes the vortex, not the external site's rendering cost.
- Cross-origin iframe `load` signals completion of the frame navigation; it cannot guarantee every third-party app has finished hydrating or detect every framing denial. Known blocked sites are excluded; unlisted sites can still produce a browser error surface. The fallback is not advertised as universal blocked-frame detection.

## DAX typography discussion

The owner asked whether DAX²⁷'s font could work on Catalogue. The older local source identified Syne Mono, but live computed styles on `https://dax27.xyz/` confirmed **Bigshot One for headings** and **Syne Mono for body/navigation**. The correction was communicated immediately. Recommendation: compare Bigshot One on the landing statement and short section headings, retaining calmer artist names and long-form text. No Bigshot One or Syne Mono substitution has been made in Catalogue; this remains a proposed experiment.

## Assistant below Dispatch — proposal only

The owner asked about a small contextual AI assistant for platform guidance, artist/gallery discovery and related editorial content. No chatbot or paid resource has been created. Suggested first version: a compact Ask Catalogue surface, a server-side API endpoint, retrieval over public Catalogue/Sanity content, concise answers with internal source links, rate limits and a server-enforced spending ceiling. External artist-site summaries should be fetched and cached separately, clearly sourced and dated; do not promise universal live website scanning.

OpenAI documentation checked during the session lists an API-credit benefit for eligible Pro 100 subscribers: $100 per full monthly billing period, activation required, paid subscription at least seven days old, availability dependent on account/country/cohort. Account eligibility and activation have not been checked. API and ChatGPT billing are separate; credits expire with the cycle and rate limits still apply. This offer may change.

Sources:
- https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions
- https://developers.openai.com/api/docs/pricing

## Release handoff

PR #53 was verified open with two passing checks on its original mobile commit before these follow-up changes. Do not treat that CI result as validation of an unpublished revision. Push this branch, allow CI to rerun, review the logo/automatic invitation, and use the existing Cloudflare direct-upload process. No production deployment was performed in this pass.
