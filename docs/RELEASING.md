# Publishing a Catalogue release

GitHub Releases do not update when code is pushed or a Cloudflare deployment succeeds. A release needs an explicit version tag and published notes.

## Version policy

**v0.2.0 — Windows, Stories & Dispatch** is the recorded milestone following v0.1.7; a local tag exists at `cb9354d`. Local release evidence is recorded in the [documentation audit](DOCUMENTATION-AUDIT-2026-11-12.md); live GitHub/Cloudflare status must be verified separately. The owner chose 0.2 rather than a jump to 2.0. Keep the application version in `package.json`, the root package-lock versions, changelog heading and Git tag consistent. The independent Sanity Studio package is not versioned with the frontend.

Keep past releases and tags intact. Never move an already-published version tag. Increment patches for subsequent fixes and minor versions for further pre-1.0 feature milestones.

## Historical v0.2.0 release procedure

This fixed-version script is preserved for that release. **Do not rerun it to ship later documentation or code changes, or move the existing tag.** The original invocation, from a network-enabled terminal in the repository, was:

```sh
bash scripts/release-0.2.0.sh
```

The script pushes `chore/release-0.2.0`, opens its PR, waits for checks attached to the exact commit (rather than reading stale checks immediately after a push), and merges through protected main. It then updates local main, verifies/builds/audits, deploys that commit to Cloudflare Pages and runs the production smoke check. Only after these steps succeed does it create the annotated `v0.2.0` tag and publish a latest GitHub Release with the checked-in notes and validation evidence.

It stops on dirty work, unexpected branches, failed checks, conflicting tags, or a remote main that changes during release. Rerun the same command after resolving the reported blocker. It does not force-push or bypass branch protection. Network/API failures are errors, not evidence that a PR or release does not exist.

The script writes publication notes and smoke/audit evidence under ignored `dist/`; the source release notes remain in `docs/releases/v0.2.0.md`. The published release includes the merged commit and validation timestamp. Save the successful Wrangler deployment ID/URL from terminal output with the release record if further operational tracing is needed.

## Subsequent changes

Use a fresh PR through protected main, verify the exact head checks, and merge before building/deploying from clean updated main. Follow [the aligned deployment procedure](DEPLOYMENT.md#aligned-release-from-a-protected-main-branch). A documentation-only merge does not change running website behavior; if exact deployed-commit alignment is required, deploy the new main and record the SHA. Create a new version/tag only for the next deliberate release, with its own notes.

## Completion criteria

- Clean local main equals freshly fetched origin/main.
- Version tag resolves to that same commit.
- Cloudflare successfully deployed that commit and production smoke checks passed.
- GitHub Release is published, marked latest, and points to that tag.

A prepared changelog entry or successful build alone does not establish publication or deployment. Future release preparation should follow this sequence with the next version and its own notes; do not reuse the fixed v0.2.0 script for another version.
