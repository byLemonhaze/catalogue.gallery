# Product Roadmap Notes

This file tracks high-value features that are intentionally **not implemented yet**.

## Artist Claim Profile Flow (Future)

Status: `planned` (documentation only)

Goal:

- Let real artists claim control of an existing profile safely.
- Keep community trust high with a clear verification flow.

### Phase 1 — Claim Request Intake

- Public `POST /api/claim-profile` endpoint (new, future) with:
  - profile slug
  - claimant email
  - proof URL(s) (official site / social)
  - optional message
- Store request in D1 (`profile_claims`) as `pending`.

### Phase 2 — Verification Workflow

- Add Studio review queue for claim requests.
- Reviewer verifies identity with one or more checks:
  - matching domain ownership
  - matching social handle history
  - manual email verification
- Reviewer marks claim as `approved` or `declined`.

### Phase 3 — Ownership Linking

- On approval, link claimant identity to the profile record.
- Record audit trail (`who approved`, `when`, `what evidence`).
- Send notification to claimant.

### Phase 4 — Self-Serve Editing (Optional)

- Add scoped edit permissions for claimed profiles.
- Keep moderation gates for sensitive fields (for example, profile URL changes).

### Security/Abuse Requirements

- Rate limit claim submissions.
- Require anti-abuse controls (captcha/turnstile).
- Keep append-only audit log for moderation decisions.
- Never auto-approve without verifiable ownership evidence.

## Operational follow-ups from the November documentation audit

These are open follow-ups, not claims that external bot behavior is absent:

- Verify and privately document the actual external Grok bot schedule, approval gate, retry ledger and one approved site-first Dispatch/X run.
- Decide whether to retire the retained private Content Lab UI/API/manual workflow and exclusive model credentials in a separate code change. Inventory is in [Legacy Content Lab](legacy/CONTENT-LAB.md).
- Finish validated historical Dispatch backfill before considering removal of the bundled archive fallback; preserve provenance and explicit retraction behavior.
- Capture a current short motion recording of the Windows carousel, profile reveal, world entry/exit and Counterpoint transcript for GitHub. Existing PNG evidence cannot convey those interactions.
- Refresh portfolio captures after visual changes; verify real-device toolbar/gesture behavior separately from viewport screenshots.
