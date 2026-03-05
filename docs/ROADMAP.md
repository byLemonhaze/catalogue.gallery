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
