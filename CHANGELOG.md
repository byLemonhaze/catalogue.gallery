# Changelog

All notable changes to `catalogue.gallery` are documented in this file.

The project now uses [Semantic Versioning](https://semver.org/) for public releases. Repository releases are published through GitHub Releases and summarized here in human-readable form.

## [Unreleased]

### Changed

- Grouped the carousel and directory before Content Lab, recent stories, and editor picks; ordered navigation as Directory, Content Lab, Apply, Search.

- Removed decorative diagonal arrows from interface links and tightened recent-story rows for a minimal presentation.

- Improved Apply and About readability with solid brighter text, larger supporting copy, distinct charcoal panels, a prominent light application button, and clearer form labels, placeholders, input borders, and upload guidance.

- Aligned same-page and return-to-home section jumps below the visible header, and kept the editor picks associated with Content Lab.

- Added four persistent editor picks above the About/Apply footer; refreshed the archive, reader recommendations, and platform introduction copy.
- Added an optional Sanity homepage editorial selection document, with stable local defaults when no selection is published.
- Preserved the landing carousel composition while adding directional touch gestures, drag-click suppression, larger arrow targets, scoped keyboard controls, reduced-motion support, and a stable mobile hero height.
- Kept Exit as the sole artist-view control, added explicit states for known blocked embeds, and generated profile bootstrap data so direct artist links do not wait for the entire directory.
- Shared concurrent artist reads, deferred article bodies until opened, enabled public CMS CDN reads and idle artist-view prefetch, optimized thumbnail delivery, consolidated font requests, and added immutable caching for fingerprinted app assets with bounded lazy-import reload recovery.

- Apply requires a thumbnail/profile image, name, subtitle, valid HTTPS website URL and contact email before an application can be sent; clicking Submit highlights all missing or invalid fields together, and the server enforces the same requirements.
- Replaced the manual iframe tester with an automatic embedding-permissions check, including provider guidance when catalogue.gallery is blocked and automatic rechecks after returning to the page.
- Applications wait for a successful permissions check, and the server rechecks before accepting a submission. Unreachable sites show an unverified status instead of a false pass or a permissions error.
- HARTO’s carousel and directory cards use a top-aligned crop to keep his head visible while filling the card. All other profiles, galleries, search thumbnails and upload previews retain their original centered framing.

## [0.1.7] - 2026-03-08

Patch release for homepage navigation stop-point correction and cursor polish.

### Changed

- Corrected home section jump-navigation so the top bar lands on the intended section header block instead of stopping too early or too late
- Removed the persistent blue focus ring from home section nav clicks
- Added explicit pointer cursors to the top-left CATALOGUE brand and the footer Policy control

## [0.1.6] - 2026-03-08

Patch release for the homepage Content Lab section layout refactor.

### Changed

- Rebuilt the home Content Lab section into a stronger editorial composition with one featured story and a longer recent-archive rail
- Moved the Content Lab and archive entry buttons beneath the featured story and removed the duplicate archive CTA from the rail
- Fixed home section jump-navigation so the top bar lands on the actual section content instead of the padded shell
- Moved the directory browse CTA up beside the directory stats and added an auto-advancing 6-item directory grid with subtle slide motion
- Simplified the bottom-right social link to the X icon only

## [0.1.5] - 2026-03-08

Patch release for homepage arrow cleanup.

### Changed

- Removed the hover arrow inside homepage carousel cards
- Removed the trailing arrow from the `Apply to Catalogue` CTA

## [0.1.4] - 2026-03-08

Patch release for homepage editorial copy refinement.

### Changed

- Rewrote the Content Lab intro copy to explain the editorial side of Catalogue in more direct language

## [0.1.3] - 2026-03-08

Patch release for homepage presentation refinement.

### Changed

- Increased the carousel hero scale only on very wide desktops so oversized captures keep a stronger visual presence without changing normal laptop behavior
- Reworked the directory pager into a cleaner text-based control that stays centered on mobile and right-aligned on desktop

## [0.1.2] - 2026-03-08

Patch release for home scroll-memory and return-flow fixes.

### Added

- Persistent home-state memory for section, scroll position, and directory pagination
- Regression coverage for remembered home navigation state

### Changed

- Restored the previous home section when returning via site chrome or browser history instead of forcing the carousel hero
- Synced artist/gallery exit fallback with the same remembered home navigation state

## [0.1.1] - 2026-03-08

Homepage, navigation, and Content Lab refinement release for the new spatial CATALOGUE experience.

### Added

- Private Content Lab workspace restored at `/content-lab` with browser-side BYOK generation support
- Scroll-aware home sections with directory, Content Lab, and apply/about layers

### Changed

- Refined homepage copy, CTA wording, and section labels for consistency
- Preserved return position when exiting artists and galleries opened from the home directory section
- Cleaned navigation chrome, archive back-link behavior, and submit/apply entry flow
- Kept the Content Lab behind a clearer private-beta gate while public access is still in progress

## [0.1.0] - 2026-03-06

Initial public release for the current hardened and documented baseline of `catalogue.gallery`.

### Added

- OpenSSF Scorecard, CodeQL, and Dependabot automation on `main`
- Public bug-report and feature-request issue forms
- Private vulnerability reporting guidance and linked security workflow
- Reference docs for architecture, API behavior, deployment, and quality policy

### Changed

- Removed the dormant builder route and simplified the public application surface
- Tightened CI, workflow permissions, branch hygiene, and release discipline
- Documented contribution, testing, and reporting expectations for future changes
