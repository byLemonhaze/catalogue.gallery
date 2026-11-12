# Catalogue documentation

Use the current guides for operation and maintenance. Dated session records preserve decisions and evidence at the time; old pending-release notes, model integrations and screenshots are not today's deployment state.

## Current guides

| Guide | Purpose |
|---|---|
| [Architecture](ARCHITECTURE.md) | Current components, data flow and trust boundaries |
| [Editorial publishing](EDITORIAL-PUBLISHING.md) | External Grok bots → Sanity → Catalogue; schemas, freshness and verification |
| [Dispatch publishing](DISPATCH-PUBLISHING.md) | Archive provenance, backfill/retraction and site-first X contract |
| [API](API.md) | Public APIs and application/review contracts |
| [Deployment](DEPLOYMENT.md) | Cloudflare configuration, protected-main merge and deployment alignment |
| [SEO and sharing](SEO.md) | SSR, canonicals, redirects, caches, sitemap and social previews |
| [Quality](QUALITY.md) | Verification commands, test coverage and device-check limits |
| [Releasing](RELEASING.md) | Version policy and distinction between tags and deployment |
| [Documentation audit](DOCUMENTATION-AUDIT-2026-11-12.md) | Reconciled findings, source evidence, outstanding operational questions |

## Legacy and future work

- [Retained Content Lab](legacy/CONTENT-LAB.md): implementation still present, superseded publishing workflow. Not disabled by this documentation update.
- [Sanity MCP proposal](SANITY_MCP_PLAN.md): an exploration, not an installed integration or the active bot architecture.
- [Roadmap](ROADMAP.md): future profile claims and open operational/portfolio follow-ups.

## Session history and release evidence

Owner-approved motion pass: [motion and interaction pass](MOTION-INTERACTION-PASS-2026-11-12.md), covering attached captions, alternating transitions, preview readiness, drag comparisons and fresh discovery order. Publication proceeds through the recorded protected-main release command; see its verification evidence and limitations.

| Record | Scope |
|---|---|
| [11 November trajectory](SESSION-TRAJECTORY-2026-11-11.md) / [Windows implementation](WINDOWS-REDESIGN.md) | Initial directions, Windows selection, motion and dark system |
| [Mobile polish](MOBILE-POLISH-2026-11-12.md) / [typography and reveal](TYPOGRAPHY-AND-REVEAL-2026-11-12.md) | Safe areas, layout, names, search and profile portal |
| [Signature hydration](SIGNATURE-HYDRATION-FIX-2026-11-11.md) | Handwritten wordmark follow-up |
| [Movable exit](MOVABLE-WORLD-EXIT-2026-11-11.md) | Compact exit avoiding embedded-site navigation |
| [12 November report](SESSION-REPORT-2026-11-12.md) / [Dispatch studies](DISPATCH-DESIGN-STUDIES-2026-11-12.md) | Counterpoint selection and later Stories/identity work |
| [Dispatch opening](DISPATCH-OPENING-PROTOTYPE-2026-11-12.md) / [navigation and sharing](NAVIGATION-AND-SHARING-2026-11-12.md) | Motion, Stories URLs, About/byline and metadata |
| [Constellation identity](BRAND-CONSTELLATION.md) | Approved vector masters, exports and palette; original release status is historical |
| [Stories release checkpoint](STORIES-CONSTELLATION-RELEASE.md) | PR #57 preparation and environment limits at that time |
| [v0.2.0 notes](releases/v0.2.0.md) | Tagged milestone, following the Stories merge |

Prepared PR bodies (`*-PR.md`, `releases/v0.2.0-pr.md`) are historical text, not commands to reopen or repeat releases. Keep published tags and historical evidence intact. Live deployment/release alignment requires fresh remote checks, not a report's old status paragraph.

## Visual evidence

Start with the [full platform visual tour](presentation/README.md): twelve desktop/mobile captures covering discovery, profiles, Stories, Dispatch, directory/search, world fallback, About and Apply, paired with implementation and regression-test references. The [project README](../README.md#experience-in-pictures) presents the shorter portfolio overview.

- [Stories desktop](review/navigation-sharing/stories-desktop.png) and [390 px mobile](review/navigation-sharing/stories-390.png): post-rename public UI.
- [Windows + Counterpoint](review/dispatch-studies-02/home-counterpoint.png): approved design checkpoint before the public navigation rename.
- [Automatic profile reveal](review/typography-polish/profile-auto-reveal-desktop.png): earlier portal checkpoint, also before the rename.
- [Mobile before/after captures](MOBILE-POLISH-2026-11-12.md): About, homepage, archive, directory and additional states, with original limitations.
- [Dispatch comparison](review/dispatch-studies-02/comparison.png): alternatives, not all shipped designs.

Screenshots are real captures, not current content inventories or physical-device certification. No new GIF/video was captured in this documentation pass. A current short recording of discovery → profile reveal → world → exit and the daily transcript is listed in the roadmap.
