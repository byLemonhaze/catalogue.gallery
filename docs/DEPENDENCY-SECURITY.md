# Dependency security maintenance

## 18 November 2026 update

The starting GitHub snapshot contained 241 open Dependabot alerts: 77 in the
website lockfile and 164 in Studio, including two critical alerts. These were
152 distinct advisories across 37 packages. npm counts affected dependency
packages (including their parents) differently: the starting audits reported
27 website packages and 48 Studio packages.

The updated lockfiles report **zero npm audit vulnerabilities in both projects**.
Comparing every installed package version with the vulnerable ranges in the
original GitHub snapshot also produces zero matches. GitHub alerts are not
closed by local edits; confirm the dashboard after the changes reach `main`.

### Dependency changes

- Website: React Router 7.18.5, Vite 7.3.8, Vitest 4.1.12, Sharp 0.35.5,
  PostCSS 8.5.33, and compatible transitive security updates.
- Studio: Sanity and Vision 6.24.0, with their current dependencies. Sanity 5's
  maintenance release still retained vulnerable CLI dependencies. This upgrade
  requires Node 22.12 or newer; CI uses Node 22. Existing content schemas,
  review actions, project and dataset are unchanged. `groqLegacy` explicitly
  preserves the previous Studio search strategy. Studio's TypeScript settings
  use bundler module resolution so Sanity's exported type declarations resolve.
- The public site's components, styles, content and routes are unchanged.

### Scoped Studio overrides

Even the current Sanity CLI pins vulnerable versions through its dependencies.
Keep the following overrides until upstream declares safe versions:

| Parent | Dependency | Override | Reason |
| --- | --- | --- | --- |
| `@vercel/frameworks` | `js-yaml` | `^3.15.2` | Replaces pinned 3.13.1; fixes prototype pollution and denial-of-service advisories within the same major. |
| `@vercel/frameworks` | `smol-toml` | `^1.9.1` | Replaces pinned 1.5.2 with a patched 1.x release. |
| `@oclif/core` | `minimatch` | `^11.0.1` | Fixes GHSA-g3hv-75wg-m249; the affected 10.x line has no fix recorded. Scoped to CLI command discovery. |

The minimatch override crosses a major version. Studio's clean installation,
CLI-driven production build and schema extraction were exercised with it.
Existing Architect/glob overrides are retained. Review and remove overrides
once upstream dependency constraints include the patched releases.

### Validation

- Clean website install using `npm ci --legacy-peer-deps`.
- Website lint, TypeScript and all 256 tests across 38 test files passed,
  including a run on Node 22.23.5.
- Complete website build passed, including server rendering, metadata generation
  and the share-preview audit: 521 pages, 321 local images, no failures.
- Clean Studio `npm ci`, TypeScript check and production build passed on Node 22.23.5.
- Studio schema extraction passed without changing content in Sanity.
- Both complete `npm audit --json` reports contain zero vulnerabilities.
- Local browser smoke check: homepage, artist profile open/close and return,
  Dispatch edition and story loading; no application console errors observed.

Authenticated editorial actions and production deployment have not been tested
or performed as part of this local change. Vite preview does not emulate
Cloudflare Pages Functions. Follow the existing deployment runbook for release
and live checks.

### Ongoing checks

CI now audits both projects at high severity or above and type-checks, builds
and extracts Studio's schema alongside the existing website checks. Dependabot groups
security updates separately from compatible minor/patch maintenance updates
for each project. Major version changes remain separate.

GitHub reported Dependabot updates paused due to inactivity. Grouping changes
alone do not resume them. After review, merge a suitable, freshly checked
Dependabot PR as GitHub's banner directs, then verify updates resume. Existing
tar 7.5.11 and undici 7.24.1 update PRs are superseded by this cleanup; do not
merge their older lockfiles over these fixes.

References: [Sanity 5 to 6 migration](https://www.sanity.io/docs/help/v5-to-v6),
[minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249),
[Dependabot configuration](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).
