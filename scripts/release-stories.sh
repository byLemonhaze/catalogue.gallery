#!/usr/bin/env bash
# Explicitly authorized release: stops on failed checks, conflicts, divergence or dirty work.
set -euo pipefail
cd "$(dirname "$0")/.."
release_branch=feat/stories-constellation
release_repo=byLemonhaze/catalogue.gallery
require_clean() {
  if [ -n "$(git status --porcelain)" ]; then
    printf '%s\n' 'Working tree is not clean. Preserve and review the changes before releasing.' >&2
    exit 1
  fi
}
require_clean
gh auth status
git fetch origin
branch=$(git branch --show-current)
if [ "$branch" != "$release_branch" ] && [ "$branch" != main ]; then
  printf 'Expected %s or main; found %s.\n' "$release_branch" "$branch" >&2
  exit 1
fi
pr_state=$(gh pr list --repo "$release_repo" --head "$release_branch" --state all --json state --jq '.[0].state // ""')
if [ "$pr_state" = MERGED ] && [ "$branch" = "$release_branch" ]; then
  test "$(gh pr view "$release_branch" --repo "$release_repo" --json headRefOid --jq .headRefOid)" = "$(git rev-parse HEAD)"
fi
if [ "$pr_state" != MERGED ]; then
  if [ "$branch" != "$release_branch" ] || [ "$pr_state" = CLOSED ]; then
    printf '%s\n' 'Release PR is not ready for this branch. Inspect its status before continuing.' >&2
    exit 1
  fi
  git merge --no-edit origin/main
  npm run verify
  npm run build
  npm run audit:shares -- --remote
  require_clean
  git push -u origin "$release_branch"
  if [ -z "$pr_state" ]; then
    gh pr create --repo "$release_repo" --base main --head "$release_branch" \
      --title 'Unify Stories navigation, Constellation branding and share previews' \
      --body-file docs/STORIES-CONSTELLATION-PR.md
  fi
  # No force merge, admin override, or bypass of required checks.
  # If GitHub has not registered checks yet, this stops; rerun once they appear.
  gh pr checks "$release_branch" --repo "$release_repo" --watch --fail-fast
  gh pr merge "$release_branch" --repo "$release_repo" --squash --match-head-commit "$(git rev-parse HEAD)"
fi
git switch main
git pull --ff-only origin main
require_clean
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
release_sha=$(git rev-parse HEAD)
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
gh pr view "$release_branch" --repo "$release_repo" --json url,state,mergeCommit
npx wrangler pages deployment list --project-name catalogue
printf '\nLocal main and freshly fetched origin/main: %s\n' "$release_sha"
printf '%s\n' 'Production pages match this build. Confirm the successful Production deployment above identifies the same commit.'
printf '%s\n' 'Evidence: dist/share-preview-audit.json and dist/production-smoke.json. Paste the final output back into the session.'
