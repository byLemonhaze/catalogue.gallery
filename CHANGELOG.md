# Changelog

All notable changes to `catalogue.gallery` are documented in this file.

The project now uses [Semantic Versioning](https://semver.org/) for public releases. Repository releases are published through GitHub Releases and summarized here in human-readable form.

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
