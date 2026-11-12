# Stories + Constellation release — 2026-11-12

> **Historical checkpoint.** This record preserves the decisions, terminology, screenshots and verification status at that stage. Pending/local-only release statements and old commands are not current deployment instructions. Use the [documentation index](README.md), [current publishing guide](EDITORIAL-PUBLISHING.md) and [reconciled audit](DOCUMENTATION-AUDIT-2026-11-12.md) for current context.

## Authorized scope

The owner approved completing remaining checks, documentation, commit, push, protected-main merge and production deployment. This includes the local Constellation identity, Dispatch/page/story transitions, Stories migration, About/byline fixes and sharing checks. It does not authorize bypassing required CI or deploying an incomplete build.

## Environment checkpoint

The local shell can edit, test, compile and commit. GitHub fetch/API requests fail DNS resolution. A complete `npm run build` was attempted: client and SSR compilation succeeded, but postbuild failed with `ENOTFOUND registry.npmjs.org` while resolving tsx. The previously cached tracking refs do not establish current GitHub main. A `gh auth status` failure in this environment is not proof that the user's credentials need replacing.

Full Sanity SEO generation, remote preview image validation, PR checks/merge and Cloudflare upload therefore remain pending in a network-enabled terminal. The incomplete local `dist` is not deployable.

## Resume command

From the repository:

```sh
bash scripts/release-stories.sh
```

The script requires a clean tree and the release branch (or main when resuming a merged release). It fetches and incorporates main without resetting local work, runs verify/full build/remote image audit, pushes the feature branch, creates the PR using the prepared description, waits for checks, and squash-merges the exact checked head. Conflicts, failed checks, a dirty tree or divergent main stop the run.

It then updates local main with fast-forward only, builds that exact commit, reruns share checks, uploads to the existing `catalogue` project on Cloudflare's `production` branch, and checks representative production redirects, canonical/share metadata and the deployed entry bundle against the local build. It finishes by fetching again and displaying PR/deployment evidence. If checks have not registered when `gh pr checks` runs, wait for GitHub and rerun the script.

## Evidence required before declaring alignment

- PR URL, MERGED state and merge SHA.
- Clean local main equals freshly fetched origin/main.
- Complete build and `dist/share-preview-audit.json` with zero failures, including remote images.
- Wrangler successful Production deployment ID/URL naming the same SHA.
- `dist/production-smoke.json` with zero failures and matching local/production entry bundle.
- Browser smoke check of home, Stories/article, Dispatch, artist profile/world/exit. External social networks may cache older unfurls; a valid server response cannot force recrawling.

Record observed release identifiers/results in the PR release record after deployment, without creating another source commit solely to store a deployment SHA (which would immediately make it stale). Do not describe the release as deployed or aligned while any above check remains unobserved.

Final local verification before commit: lint, TypeScript and **225 tests across 33 files passed**. Release shell syntax and production-check script syntax passed. The full network-backed build remains blocked as recorded above.

## PR #57 validation and CodeFactor follow-up

The owner ran the complete release build in a network-enabled terminal. SEO generation succeeded for 320 profiles, 146 articles and 8 static routes. The share audit covered 502 pages and 321 local images; all 174 remote images were checked with zero failures (latest supplied audit: 2026-11-12T06:56:24.738Z).

Commit `0069d9a` was pushed to `feat/stories-constellation`; [PR #57](https://github.com/byLemonhaze/catalogue.gallery/pull/57) is open. GitHub's required **Lint, type check, test, build** job passed. CodeFactor reported two `no-duplicate-selectors` findings in `src/design/dispatch-studies.css`: `button` and `.poster-ghost`. Consolidated each selector's declarations without changing their effective styling. No check was bypassed.

The release script stopped at the failed quality check before merging or deploying. The corrected head must be pushed and pass checks; then the same release script resumes the protected-main merge, full build, deployment and alignment checks. Production alignment remains unverified.

Follow-up validation: lint, TypeScript and all 225 tests in 33 files passed. A PostCSS comparison confirmed unchanged effective declarations and no duplicate selectors within the same stylesheet context. Remote CodeFactor validation of the fix is pending push.
