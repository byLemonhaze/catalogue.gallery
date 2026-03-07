# Security Policy

## Reporting a Vulnerability

If you discover a security issue in `catalogue.gallery`, please report it privately.

- Preferred: open a private security advisory on GitHub for this repository:
  - https://github.com/byLemonhaze/catalogue.gallery/security/advisories/new
- Alternative: contact the maintainer directly and include:
  - affected URL or feature
  - reproduction steps
  - impact assessment
  - suggested mitigation (if available)

Please do not disclose vulnerabilities publicly until a fix is released.

For non-security defects, use the public issue tracker instead:

- https://github.com/byLemonhaze/catalogue.gallery/issues/new/choose

## Supported Versions

Security fixes are applied to the current production deployment and the latest commit on `main`.

Older preview deployments, stale branches, and historical builds are not supported with backported fixes.

## Scope

This policy covers:

- the web application code in this repository
- API routes and data processing logic committed here
- deployment configuration and CI workflows

## Handling Process

1. Confirm report receipt.
2. Reproduce and assess severity.
3. Prepare and validate a fix.
4. Release patch and publish disclosure details when safe.

## Response Targets

- Initial acknowledgement target: within 5 business days
- Status update target: within 10 business days when reproduction succeeds
- Remediation target: depends on severity, deployment risk, and third-party provider constraints
