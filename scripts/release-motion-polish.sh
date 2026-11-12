#!/usr/bin/env bash
# Explicitly authorized release: stops on failed checks, conflicts, divergence or dirty work.
set -euo pipefail
cd "$(dirname "$0")/.."
release_branch=feat/motion-interaction-polish
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
      --title 'Polish discovery motion, fluid scrubbing and profile preview readiness' \
      --body-file docs/MOTION-INTERACTION-PR.md
  fi
  # Wait for checks on this exact pushed commit, not stale results from the previous push.
  release_head=$(git rev-parse HEAD)
  checks_ready=false
  for ((attempt=0; attempt<60; attempt++)); do
    check_names=$(gh api "repos/$release_repo/commits/$release_head/check-runs" --jq '.check_runs[].name')
    status_names=$(gh api "repos/$release_repo/commits/$release_head/status" --jq '.statuses[].context')
    if printf '%s\n' "$check_names" | grep -Fxq 'Lint, type check, test, build' &&
       printf '%s\n%s\n' "$check_names" "$status_names" | grep -Fxq 'CodeFactor'; then
      checks_ready=true
      break
    fi
    printf '%s\n' 'Waiting for CI and CodeFactor to register on the pushed commit...'
    sleep 5
  done
  [ "$checks_ready" = true ] || { printf '%s\n' 'Checks are not registered yet; rerun this command later.' >&2; exit 1; }
  test "$(gh pr view "$release_branch" --repo "$release_repo" --json headRefOid --jq .headRefOid)" = "$release_head"
  # No force merge, admin override, or bypass of required checks.
  gh pr checks "$release_branch" --repo "$release_repo" --watch --fail-fast
  gh pr merge "$release_branch" --repo "$release_repo" --squash --match-head-commit "$(git rev-parse HEAD)"
fi
git switch main
git pull --ff-only origin main
require_clean
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
release_sha=$(git rev-parse HEAD)
npm run verify
npm run build
npm run audit:shares -- --remote
require_clean
npx wrangler whoami
git fetch origin
test "$(git rev-parse origin/main)" = "$release_sha"
# A public source marker lets the final check verify the exact production commit.
node --input-type=module - "$release_sha" <<'NODE'
import fs from 'node:fs';
fs.writeFileSync('dist/release.json', JSON.stringify({commit:process.argv[2],builtAt:new Date().toISOString()})+'\n');
NODE
npx wrangler pages deploy dist --project-name catalogue --branch production --commit-hash "$release_sha"
node scripts/check-production.mjs
node --input-type=module - "$release_sha" <<'NODE'
const expected=process.argv[2];
const response=await fetch(`https://catalogue.gallery/release.json?commit=${expected}`, {headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
if(!response.ok) throw new Error(`Production source marker returned ${response.status}`);
const release=await response.json();
if(release.commit!==expected) throw new Error(`Production is ${release.commit}; expected ${expected}`);
console.log(`Verified production source commit: ${release.commit}`);
NODE
git fetch origin
require_clean
test "$(git rev-parse HEAD)" = "$release_sha"
test "$(git rev-parse origin/main)" = "$release_sha"
gh pr view "$release_branch" --repo "$release_repo" --json url,state,mergeCommit
npx wrangler pages deployment list --project-name catalogue
printf '\nLocal main and freshly fetched origin/main: %s\n' "$release_sha"
printf '%s\n' 'Verified: local main, freshly fetched origin/main and production source marker match; production pages serve this build.'
printf '%s\n' 'Evidence: dist/share-preview-audit.json and dist/production-smoke.json. Paste the final output back into the session.'
