# CATALOGUE — local continuation: resolve CodeFactor and finish PR #61

Prepared 12 November 2026. Read this first in the new chat, then inspect the actual checkout and current remote state. This is a continuation of approved work, not a new redesign.

## Goal and authorization

The owner, Lemonhaze (Frédérick Nathaniel St-Louis), approved the local motion polish and explicitly requested: **commit, push, merge into main, deploy, and leave local main, GitHub main and production aligned**. The work is committed and pushed, but the release stopped at CodeFactor on PR #61. Diagnose and fix its actual findings, preserve the approved experience, document the follow-up, pass the checks, and finish the authorized release.

Do not ask again for approval to perform these already-authorized actions. Respect branch protection and mandatory checks. Do not force-push main, use an admin merge bypass, remove checks, or deploy a feature-branch build as production. Ask for a specific missing access only if genuinely required; attempt the available native approval mechanism when the session permits it.

## Run locally, on the owner's Mac

- Open the existing local folder: `/Users/lemonhaze/Desktop/CATALOGUE/catalogue.gallery`.
- Use the local Codex/repository experience. Do not start a cloud clone or migrate the project to another hosting service.
- Confirm `pwd`, the Git checkout, and local terminal/network capabilities before claiming access.
- Existing local preview: `http://127.0.0.1:5174/`. The owner started Vite in their own terminal. Inspect available ports before starting another process; do not stop unrelated projects.
- If needed: `npm run dev -- --host 127.0.0.1 --port 5174`.
- The previous agent could read/write this actual Mac checkout and run tests, but its execution sandbox could not resolve GitHub/npm or listen on localhost. A real local filesystem path alone does not establish unrestricted local networking.
- The owner's Terminal has working GitHub authentication as `byLemonhaze`; the same release script reached GitHub successfully there. Do not print tokens or read credential stores.
- The previous session exposed no browser-control tool, despite the app displaying a local preview. Browser permission settings and availability of the actual control connection are separate.
- Re-discover capabilities in the new session. Do not assume the old network restrictions still apply, or that a restart necessarily fixed them. Do not repeatedly send the owner to speculative settings.

## Exact checkpoint

| Item | Last verified state |
| --- | --- |
| Repository | `https://github.com/byLemonhaze/catalogue.gallery` |
| Branch | `feat/motion-interaction-polish`, tracking `origin/feat/motion-interaction-polish` |
| Approved implementation commit | `c8787963bfc4137a0e85fe82fa96e2fa69645f71` |
| Commit title | `Polish discovery motion, fluid scrubbing and profile preview readiness` |
| Earlier included docs commit | `f34a699` — expand platform visual tour |
| Previously fetched main | `83c8fee` — PR #60 publishing documentation; fetch again rather than treating this as current |
| Pull request | `https://github.com/byLemonhaze/catalogue.gallery/pull/61` |
| CodeFactor | Failed after 12 seconds in owner's release output; exact findings are still unknown |
| GitHub CI | Pending in the last owner-supplied output; query its current result |
| Merge/deployment | This release script stopped before either; no subsequent completion evidence supplied |
| Package version | `0.2.0`; this pass does not require a new tag |
| Cloudflare Pages | Project `catalogue`, configured production deployment branch `production`, output `dist` |
| Production domain | `https://catalogue.gallery` |

Immediately before writing this handoff, the tree was clean at `c878796`. **This handoff and the appended release-checkpoint note are intentional local documentation changes created after that commit.** Include them with the next follow-up commit. The release script requires a clean tree, so do not run it blindly before committing these and any fixes. Preserve any additional changes discovered in the new session.

## What actually succeeded

The owner ran `bash scripts/release-motion-polish.sh` from the correct checkout and supplied its full output:

- GitHub authentication succeeded.
- Main integration reported already up to date.
- `npm run verify` passed ESLint, TypeScript and **245 tests across 36 files**.
- Full `npm run build` completed, including SEO generation (unlike the previous agent's network-blocked attempts).
- SEO generation: **320 profiles, 148 articles and 8 static routes**.
- Local share audit: **505 pages, 321 local images, 177 remote images, no failures**; checked at `2026-11-12T20:41:02.332Z`.
- Remote share audit checked **all 177 remote images**, no failures; checked at `2026-11-12T20:41:31.075Z`.
- Branch push succeeded, including the earlier visual-tour documentation commit.
- PR #61 was created.
- The script waited for CI/CodeFactor registration, then stopped at failed CodeFactor while CI was pending.

The `>500 kB` Vite warning, Node `--localstorage-file` warning and jsdom document-navigation notice did not fail this run. Do not confuse them with the CodeFactor failure. The GitHub dependency alert is a separate backlog; it is not evidence of the cause of this check failure.

Compiled client entry was `index-DrSS7T-p.js`, **619.03 kB / 181.27 kB gzip**; SSR bundle **1,449.15 kB**. Fresh fixes can legitimately change hashes and sizes.

## First task: read the actual failed report

Start with these read-only commands from the repository:

```bash
git status --short --branch
git log -4 --oneline
gh pr view 61 --repo byLemonhaze/catalogue.gallery --json state,headRefOid,statusCheckRollup,url
```

Use the returned current PR head SHA to inspect both check runs and commit statuses:

```bash
gh api repos/byLemonhaze/catalogue.gallery/commits/HEAD_SHA/check-runs
gh api repos/byLemonhaze/catalogue.gallery/commits/HEAD_SHA/status
```

Replace `HEAD_SHA` with the returned SHA, not a literal string. Follow CodeFactor's actual `details_url` / `target_url`. If annotations are supplied, read them; otherwise inspect the linked CodeFactor page using an available authenticated browser or supported connector. Record each finding's rule, path and line before choosing the fix. GitHub Actions logs alone may not contain an external CodeFactor report.

Prior attempts through the old terminal, GitHub API and web fetcher could not retrieve the report. **Do not invent findings.** Local inspection showed existing duplicate selectors in `src/windows.css`, but this is only an investigative lead, not a confirmed cause. Prior PR #57 had two duplicate-selector issues in a different file, `src/design/dispatch-studies.css`; that history does not prove what failed in PR #61.

If the new session is restricted, request narrowly scoped network/browser access using its actual supported approval flow. If escalation is explicitly disabled, explain that specific limitation. Do not claim to have raised a permission prompt or connected a browser unless the tool confirms it.

## Approved five-item implementation — preserve this behaviour

1. **Captions follow warped artwork.** SVG caption baselines follow the same lower-edge deformation as the image, with curved clickable image outlines. The separate Selected Artist heading stays stable and readable. Accessible names and DOM/reduced-motion fallbacks remain.
2. **Alternating navigation reveals.** Ordinary pages and Stories alternate horizontal/vertical centre-out expansion. Dispatch retains its separate aperture and does not consume the ordinary direction sequence. Preserve reduced motion, fallback navigation and modified-link behaviour.
3. **No premature website flash.** Artist preview iframes stay concealed until iframe load, covering artwork decode/frame readiness, and the first WebGL frame or explicit fallback. Slow/failed artwork, texture timeout, quick dismissal and artist switches must not expose an uncovered site before its tear.
4. **Fluid carousel control.** Direct/Weighted/Free glide artwork-drag comparisons exist only in development. Weighted is the current default. The owner rejected the first rigid scrubber revision; the approved follow-up restores fractional scrubbing with a responsive handle, 65 ms artwork easing, velocity-driven image bend, and gentle nearest-artist settling on release without an additional throw. Keep cancellation, focus/keyboard, vertical touch scrolling, pinch zoom and drag/click separation intact.
5. **Fresh discovery with stable returns.** Shuffle once per new document/refresh, preserve ordering/selected artist/fractional position/pause across internal navigation, avoid hydration mismatch or a visible first-order flash. No persistent cached initial lineup across document reloads. New random order does not mathematically guarantee a different first artist every time.

Important slider details: `step=0.001`; artwork tracks a fractional target; selected name/counter identify the nearest visible artist; release rounds the destination only. The thumb stays at its chosen destination while artwork settles. A held scrub rebases accumulated rotations without changing the composition. Keyboard arrows choose whole artists, including Up/Down on the focused range. Do not reintroduce integer stepping for pointer scrubbing or zero warp on every pointer update.

## Relevant code and tests

- `src/components/WindowsCarousel.tsx`: animation loop, wheel/drag/scrubber, keyboard, pause, development feel chooser.
- `src/lib/carouselFeel.ts`: bounded release momentum and feel parameters.
- `src/components/WindowCaption.tsx`, `src/lib/captionMotion.ts`, `src/lib/windowWarp.ts`, `src/windows.css`: curved text, warped hit shapes, GPU/DOM surface coordination.
- `src/components/ProfileSurface.tsx`, `src/lib/profileVortex.ts`, `src/profile-portal.css`: opaque cover and iframe/GPU readiness.
- `src/lib/pageOpening.ts`, `src/dispatch-opening.css`: alternating page/Story axes.
- `src/lib/discoverySession.ts`, `src/hooks/useDiscovery.ts`, `src/App.tsx`, `src/pages/HomeExperience.tsx`, `index.html`: discovery memory, client shuffle, SSR/noscript handling.
- Regressions: `carouselFeel.test.tsx`, `captionMotion.test.ts`, `discoverySession.test.tsx`, `profileSurface.test.tsx`, `dispatchOpening.test.ts`, `windowsExperience.test.tsx`, `mobilePolish.test.tsx`.

Make the smallest reviewable correction supported by the CodeFactor findings. Preserve CSS cascade and responsive rules when consolidating declarations; moving repeated rules can change effective styling. Do not disable quality rules to make the check green.

## Release procedure already prepared

Read `scripts/release-motion-polish.sh` before using it. It:

1. Requires a clean tree and the expected branch/main; authenticates and fetches GitHub.
2. Integrates `origin/main` into the feature branch without force/reset.
3. Runs verification, the **complete build including SEO postbuild**, and remote share audits.
4. Pushes and reuses the existing PR (creates one only when absent).
5. Waits for CI and CodeFactor to register on the exact pushed commit; checks the PR head; waits for successful checks.
6. Squash-merges through protected main with a matching-head constraint.
7. Switches to local main and fast-forwards from GitHub. Stops on divergence instead of discarding local work.
8. Repeats verification/build/share audits on merged main.
9. Confirms Cloudflare authentication, checks main has not advanced, writes `dist/release.json` containing the source SHA and build time, then deploys:
   `npx wrangler pages deploy dist --project-name catalogue --branch production --commit-hash "$release_sha"`
10. Runs `node scripts/check-production.mjs`, verifies the public source marker against the deployment SHA, fetches main again, checks the clean local tree and SHA equality, and prints evidence.

After fixing, testing, documenting and committing, resume with:

```bash
cd /Users/lemonhaze/Desktop/CATALOGUE/catalogue.gallery
bash scripts/release-motion-polish.sh
```

Do not publish an incomplete `dist` from an interrupted SEO postbuild. Do not bypass a failed external check. If a merge introduces conflicts, resolve carefully and rerun affected checks. If CI has not registered or the external check is delayed, inspect the exact current head rather than reading stale results from the previous commit.

## Documentation and verification expectations

Read and update:

- `docs/MOTION-INTERACTION-PASS-2026-11-12.md`: approved brief, investigation, implementation, test checkpoints, limits, and latest release attempt.
- `docs/MOTION-INTERACTION-PR.md`: final reviewer-facing summary; update validation now that the owner's complete build and audits succeeded.
- `docs/DEPLOYMENT.md`: release runbook.
- `docs/README.md`, `CHANGELOG.md`: index and change inventory as necessary.
- `docs/presentation/README.md` and root README: earlier visual-tour work is already included via `f34a699`; preserve it.

Record actual CodeFactor findings, fixes, validation outcomes and release evidence. Distinguish historical environment failures from the successful owner-terminal run. Do not rewrite historical checkpoints as though they never happened. Avoid claiming deployment in a pre-deployment document. After success, evidence can be attached to the existing PR with its source commit and deployment URL, avoiding an unnecessary new source commit solely to record its own deployment.

Checks: `npm run verify`, `npm run build`, `npm run audit:shares -- --remote`, `git diff --check`, and relevant targeted regressions. No new visual recordings were captured by the old agent. Owner locally reviewed the design; physical Safari/low-power GPU performance is not certified.

## Branding and scope boundaries

- Dark-only. Syne headings, Sora body/UI, IBM Plex Mono controls; handwritten `.gallery` wordmark and Constellation identity.
- Artist profile before world; preserve iframe-first artist-owned environments, compact movable exit, known blocked-embed fallbacks.
- Public editorial section is **Stories**, with legacy `/blog/` redirects. Dispatch is separate, using the approved Counterpoint transcript.
- Publishing is external Grok bots → Sanity → runtime content. Do not build/reconfigure bots or mutate editorial content for this release.
- Do not modify lemonhaze.com, DAX²⁷ or another repository. Wrong-chat requests about those projects were explicitly withdrawn.
- No light/electric themes, new typography experiments, new logo exploration, or redesign of accepted motion during quality cleanup.

## Definition of done

- Actual CodeFactor report inspected; findings resolved with no check bypass.
- Tests, lint, typecheck, complete build and share audits pass for the final change.
- PR #61 merged through normal protection.
- Local main clean and equal to freshly fetched origin/main.
- Production serves the newly built bundle and `/release.json` identifies that same main SHA.
- Production smoke check passes and deployment URL/commit are reported.
- Documentation accurately records this trajectory and remaining physical-device/performance limits.

The owner wants completion, not more speculative access troubleshooting. Use the tools available in the new local session, continue autonomously within the existing authorization, and report any genuine blocker precisely.
