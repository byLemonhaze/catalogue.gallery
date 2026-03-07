# Quality and Verification

`catalogue.gallery` uses a documented build, test, and static-analysis workflow for every change merged to `main`.

## Build System

The repository uses common FLOSS tooling:

- Node.js
- npm
- TypeScript
- Vite

Local build commands:

```bash
npm install
npm run build
```

The production build command is `npm run build`, which runs TypeScript compilation and the Vite build pipeline.

## Automated Test Suite

The project ships a public automated test suite built with Vitest and Testing Library.

Run the full suite locally with:

```bash
npm test -- --run
```

Or run the full verification gate with:

```bash
npm run verify
```

`npm run verify` runs:

- ESLint
- TypeScript type-checking
- the Vitest suite

The CI workflow runs on every pull request to `main` and on direct pushes to `main`. Changes are not considered ready to merge until lint, type checking, tests, and build all pass.

## Static Analysis and Warning Policy

Static analysis is part of the default workflow:

- ESLint checks JavaScript and TypeScript quality rules
- TypeScript strictness catches type errors during verification
- CodeQL runs on pull requests, pushes to `main`, and on a weekly schedule

Warnings and failing checks should be resolved before merge. If a warning or rule must be bypassed, the pull request should explain why the exception is safe and intentional.

## New Functionality Testing Policy

New user-facing behavior, API behavior, or data-processing logic should include automated test coverage whenever practical.

If a change cannot reasonably add automated tests, the pull request should explain why in plain language. Examples include provider-dependent behavior that is only exercisable in production-like integrations, or visual polish changes with no stable test surface.

When a change updates a public interface, the author should also update the relevant documentation, especially:

- [`docs/API.md`](./API.md)
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`README.md`](../README.md)
- [`CONTRIBUTING.md`](../CONTRIBUTING.md)
