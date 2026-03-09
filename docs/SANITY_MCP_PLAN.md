# Sanity MCP Plan

## Goal

Add Sanity-powered agent access to `catalogue.gallery` without weakening the current privacy and review workflow.

## Current Project Shape

- Sanity project: `ebj9kqfo`
- Dataset: `production`
- Studio path: `catalogue.gallery/studio/`
- Document types: `artist`, `gallery`, `collector`, `post`
- Review actions live in Studio and currently drive approval/decline publish flows plus webhook-triggered emails

## Important Constraint

The `artist`, `gallery`, and `collector` schemas still contain hidden private fields:

- `contactId`
- legacy encrypted `email`

Those fields are hidden in Studio, but they still exist on the documents. That means a naive read-token MCP setup for directory documents is too permissive by default.

## Recommended Architecture

### Phase 1: Safe Read-Only Agent Context

Start with Sanity Agent Context for editorial content only.

Initial scope:

- `post` documents only

Use cases:

- summarize existing editorial coverage
- inspect blog/interview/article structure
- support draft planning against existing published content
- verify slug, excerpt, thumbnail, and content conventions before publish

Why this should go first:

- `post` documents are the cleanest content model
- no private contact workflow is involved
- it gives Codex useful context without exposing submission metadata

### Phase 2: Optional Full-Access Sanity MCP

Add the full-access Sanity MCP server only for trusted maintenance sessions.

Good uses:

- inspect schema and Studio structure
- assist with migrations and content repair
- inspect assets and references
- support controlled editorial operations when you explicitly want agent help

Do not use full-access MCP for routine work by default.

### Phase 3: Directory Access Only After Privacy Hardening

Do not expose `artist`, `gallery`, or `collector` to read-only agent context until one of these is true:

- private contact fields move out of those document types entirely
- a separate dataset is created for agent-safe public directory content
- Sanity role/configuration guarantees the MCP path cannot read those fields

Until then, keep directory access out of the first MCP rollout.

## What Not To Automate Through MCP Yet

Do not let the agent perform these actions directly:

- approve or decline submissions
- set `status` on reviewable documents
- edit rejection reasons or approval notes as part of a send flow
- trigger applicant communication workflows without a human review step

Reason:

- `Approve & Notify` and `Decline & Notify` are Studio document actions tied to publish + webhook behavior
- direct mutation would bypass the intended review surface and make mistakes easier

## Concrete Setup Plan

### 1. Enable Editorial Agent Context In Studio

Use the Sanity Agent Context plugin described in Sanity's MCP docs.

Create one context for:

- name: `catalogue-editorial-posts`
- access: read only
- document type scope: `post`
- purpose: give Codex safe context about existing editorial content and conventions

Suggested instruction text for that context:

> This context is for published and draft editorial posts in CATALOGUE. Use it to understand tone, structure, slug conventions, excerpt quality, thumbnail usage, featured-artist references, and markdown content patterns. Do not infer submission-review status or applicant contact data from this context.

### 2. Keep Review Queue Outside The First Context

Do not include:

- `artist`
- `gallery`
- `collector`

in the first Agent Context document.

### 3. Add Full-Access MCP Separately

When you want schema-aware maintenance support, configure the general Sanity MCP server from the Studio directory using Sanity's MCP tooling.

Treat it as a privileged tool for:

- schema inspection
- migration support
- repair tasks
- explicit one-off content operations

Do not leave it as the assumed default context for normal coding or editorial work.

### 4. Add Repo Guidance For Usage

When Sanity MCP is live, Codex prompts for this repo should follow this split:

- editorial planning or post inspection: use read-only Agent Context
- schema or migration work: use full-access MCP only when asked
- submission review decisions: human in Studio

## Suggested Prompt Patterns

### Editorial Context

- "Use Sanity editorial context to compare the last five published posts and tell me where our excerpts or thumbnails are weak."
- "Inspect existing Sanity posts and propose a new article that fits the strongest patterns without repeating them."

### Schema and Repair

- "Inspect the Sanity schema and identify any mismatch between `post` fields and the `/api/content-publish` payload."
- "Review Studio schema changes needed to support a new editorial field before I implement them."

### Avoid

- "Approve all pending artists"
- "Decline low-quality submissions automatically"
- "Patch review statuses in bulk"

## Checklist Before Enabling Directory Context Later

- move private contact metadata fully out of public directory documents, or prove that MCP cannot read it
- verify only intended document types are exposed
- verify the review webhook flow still requires a human-controlled decision point
- test with harmless read-only prompts before using on real maintenance tasks

## Local Files To Revisit When Wiring This

- `studio/sanity.config.ts`
- `studio/reviewConfig.ts`
- `studio/schemas/catalogueEntrySchema.ts`
- `studio/schemas/post.ts`
- `docs/API.md`
- `README.md`

## Bottom Line

The first Sanity MCP rollout for `catalogue.gallery` should be conservative:

- editorial `post` context first
- privileged full-access MCP only when explicitly needed
- no directory or review-flow automation until privacy boundaries are tighter
