#!/usr/bin/env bash
# Publish the approved milestone only after checks and a verified production upload.
set -euo pipefail
cd "$(dirname "$0")/.."
release_repo=byLemonhaze/catalogue.gallery
release_branch=chore/release-0.2.0
release_tag=v0.2.0
fail() { printf '%s\n' "$*" >&2; exit 1; }
require_clean() {
  [ -z "$(git status --porcelain)" ] || fail 'Working tree is not clean; preserve and review changes first.'
}
require_clean
gh auth status
git fetch origin --tags
branch=$(git branch --show-current)
[ "$branch" = "$release_branch" ] || [ "$branch" = main ] || fail 'Switch to the release branch or main before resuming.'
pr_state=$(gh pr list --repo "$release_repo" --head "$release_branch" --state all --json state --jq '.[0].state // ""')
if [ "$pr_state" != MERGED ]; then
  [ "$branch" = "$release_branch" ] || fail 'The release preparation PR must merge before running from main.'
  [ "$pr_state" != CLOSED ] || fail 'The release PR is closed; inspect it before continuing.'
  git merge --no-edit origin/main
  require_clean
  git push -u origin "$release_branch"
  if [ -z "$pr_state" ]; then
    gh pr create --repo "$release_repo" --base main --head "$release_branch" \
      --title 'Prepare v0.2.0: Windows, Stories & Dispatch' \
      --body-file docs/releases/v0.2.0-pr.md
  fi
  release_head=$(git rev-parse HEAD)
  # Check runs are queried by immutable SHA to avoid the previous release's race.
  checks_ready=false
  for ((attempt=0; attempt<60; attempt++)); do
    check_names=$(gh api "repos/$release_repo/commits/$release_head/check-runs" --jq '.check_runs[].name')
    if printf '%s\n' "$check_names" | grep -Fxq 'Lint, type check, test, build' && \
       printf '%s\n' "$check_names" | grep -Fxq 'CodeFactor'; then
      checks_ready=true
      break
    fi
    printf '%s\n' 'Waiting for GitHub to register CI and CodeFactor on the new commit...'
    sleep 5
  done
  [ "$checks_ready" = true ] || fail 'Checks have not registered yet. Rerun when GitHub has started them.'
  test "$(gh pr view "$release_branch" --repo "$release_repo" --json headRefOid --jq .headRefOid)" = "$release_head"
  gh pr checks "$release_branch" --repo "$release_repo" --watch --fail-fast
  gh pr merge "$release_branch" --repo "$release_repo" --squash --match-head-commit "$release_head"
elif [ "$branch" = "$release_branch" ]; then
  test "$(gh pr view "$release_branch" --repo "$release_repo" --json headRefOid --jq .headRefOid)" = "$(git rev-parse HEAD)"
fi
git switch main
git pull --ff-only origin main
require_clean
release_sha=$(git rev-parse HEAD)
test "$release_sha" = "$(git rev-parse origin/main)"
test "$(node -p "require('./package.json').version")" = 0.2.0
if git show-ref --verify --quiet "refs/tags/$release_tag"; then
  test "$(git rev-list -n 1 "$release_tag")" = "$release_sha" || fail 'Existing release tag names another commit; do not move it.'
fi
npm run verify
npm run build
npm run audit:shares -- --remote
require_clean
npx wrangler whoami
git fetch origin
test "$(git rev-parse origin/main)" = "$release_sha"
npx wrangler pages deploy dist --project-name catalogue --branch production --commit-hash "$release_sha"
node scripts/check-production.mjs
git fetch origin
require_clean
test "$(git rev-parse HEAD)" = "$release_sha"
test "$(git rev-parse origin/main)" = "$release_sha"
if ! git show-ref --verify --quiet "refs/tags/$release_tag"; then
  git tag -a "$release_tag" "$release_sha" -m 'Catalogue v0.2.0 — Windows, Stories & Dispatch'
fi
git push origin "refs/tags/$release_tag"
cp docs/releases/v0.2.0.md dist/release-0.2.0-notes.md
printf '\n## Publication evidence\n\nSource commit: `%s`\n\nVerification completed (UTC): %s\n\nThe full build, local/remote share audits and production smoke check passed before publication.\n' \
  "$release_sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> dist/release-0.2.0-notes.md
release_exists=$(gh release list --repo "$release_repo" --limit 100 --json tagName --jq 'any(.[]; .tagName == "v0.2.0")')
if [ "$release_exists" != true ]; then
  gh release create "$release_tag" --repo "$release_repo" --verify-tag --latest \
    --title 'v0.2.0 — Windows, Stories & Dispatch' \
    --notes-file dist/release-0.2.0-notes.md \
    dist/share-preview-audit.json dist/production-smoke.json
fi
git fetch origin --tags
require_clean
test "$(git rev-parse origin/main)" = "$release_sha"
test "$(git rev-list -n 1 "$release_tag")" = "$release_sha"
gh release view "$release_tag" --repo "$release_repo" --json url,tagName,isDraft,isPrerelease,publishedAt
gh api "repos/$release_repo/releases/latest" --jq .tag_name
printf '\nLocal main, origin/main and %s: %s\n' "$release_tag" "$release_sha"
printf '%s\n' 'Production smoke checks passed. Compare the successful Wrangler deployment above with this commit.'
