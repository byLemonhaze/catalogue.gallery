# Stories + Constellation release — 2026-11-12

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
