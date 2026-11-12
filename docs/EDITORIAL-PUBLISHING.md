# Editorial publishing: Grok bots → Sanity → Catalogue

Current operational guide, reconciled 12 November 2026.

The owner confirms that external Grok bots and Sanity are the editorial production workflow. This repository supplies the schemas, public reading experience and delivery functions. It does not contain the external bots, their scheduler, approval records, credentials or publication ledger. Their exact configuration and a successful end-to-end bot run cannot be established from this repository alone.

**Stories** provides longer articles and interviews. **Dispatch** provides the day's digital-art news. The former public name Content Lab is superseded by Stories. The retained private editor is a separate [legacy implementation](legacy/CONTENT-LAB.md), not a prerequisite for either feed.

## Ownership and boundaries

| Component | Responsibility | Evidence |
|---|---|---|
| External Grok bots | Research, prepare text/media, submit approved content to Sanity | Owner-confirmed workflow; implementation outside this repo |
| Sanity | Draft review, published documents and image assets | `studio/schemas/post.ts`, `studio/schemas/dispatch.ts` |
| Catalogue | Read published content, render pages and metadata, expose archive and search | `functions/_lib/publicContent.ts`, `src/lib/dispatch.ts`, Pages route handlers |
| External Dispatch bot | Publish approved X post after site validation; record result | Required contract in [Dispatch publishing](DISPATCH-PUBLISHING.md); external execution unverified |

Public reads do not need Grok or Anthropic keys. Bot write credentials belong in the bot's protected environment, never `VITE_*`, the browser or Git. Sanity write access for artist applications is a separate site concern. D1 and Resend continue to serve private applicant contacts and review emails.

## Story document contract

Use Sanity type `post`; review against [the schema](../studio/schemas/post.ts).

| Field | Requirement / behavior |
|---|---|
| `title`, `slug.current` | Required; canonical URL `/stories/<slug>/`. Preserve existing slugs. |
| `type` | Required stored enum `Article`, `Blog`, `Interview`. Public presentation is Stories / Interview; stored values have not been migrated. |
| `author`, `displayDate`, `excerpt` | Required; use the actual author and editorial date. |
| `content` | Required Markdown body, not a URL or empty placeholder. |
| `thumbnail` | Required Sanity image. Verify the uploaded asset and share preview. |
| `featuredArtist` | Optional reference; the public projection can prefer that profile's thumbnail for sharing. |
| `publishedAt` | Optional timestamp used for ordering and metadata. **Not a publication embargo for Stories.** |

Keep an unapproved or scheduled Story as a Sanity draft. The server's published Story query excludes draft IDs and requires slug/nonempty content; it does **not** exclude future `publishedAt` values. A future timestamp alone will not hide a published Story. Never publish early and assume the timestamp schedules it.

## Dispatch document contract

Use Sanity type `dispatch`; review against [the schema](../studio/schemas/dispatch.ts).

Required fields: `title`, `issueDate`, `slug.current` in `YYYY-MM-DD` form, `dateDisplay`, `publishedAt`, `cover` with alt text, and at least one numbered item with a headline. Use unique positive item numbers. Supply approved body text, verified source links, relevant handles, plates with credits and alt text, and artist/related Story references where available. Preserve historical text and dates. `xPostUrl` records the actual published X post after publication.

Published Dispatch queries exclude draft IDs and future publication timestamps. This visibility gate does not create or publish a document: scheduling and approval still belong to the external bot/operator.

New Sanity editions merge with the bundled historical archive by date. A published Sanity edition overrides its bundled counterpart. **Unpublishing a historical edition can expose the bundled version again.** See [archive provenance and retraction](DISPATCH-PUBLISHING.md#sanity-and-backfill) before removing or correcting historical content.

## Publication and verification

1. Create/update a draft with stable identity and complete uploaded media. Keep the approval record outside the public document.
2. Review text, sources, rights/credits, image associations, dates, links and exact approved revision. Publish only that approved revision at the intended time.
3. Load the canonical public URL directly in a fresh request. Confirm HTTP 200, the approved body, all media, canonical and OG/Twitter image. Check the relevant index, homepage placement where applicable, and `/sitemap.xml`.
4. Retry through the five-minute public HTML cache window plus normal request latency. A cached prior edition or generic SPA shell is not evidence of successful publication. If content is still absent, inspect the document, date gate, schema and response status rather than immediately redeploying.
5. For Dispatch, only then publish the approved X text/media once and record its returned URL. See the [site-first contract](DISPATCH-PUBLISHING.md#publication-contract-site-first-x-second) for ledger and retry rules.

## Does new content need a deployment?

**Ordinary valid, published Stories and Dispatch content does not require a frontend deployment.** Production Pages Functions fetch Sanity at request time, including detail URLs that did not exist at build time. The sitemap is also dynamic. The build-time inventory is a release artifact, not the complete set of URLs the live site can serve.

Public server reads use Sanity's origin API. Public HTML is cached for up to five minutes per edge location. Browser fallback reads use the Sanity CDN and may add propagation delay. Hydrated pages retain their initial data; `useDispatches` does not continuously poll or subscribe. Reload an existing tab to pick up a new edition. This is automatic availability on subsequent requests, not guaranteed live replacement in every open tab.

Code, route, schema and presentation changes still require their respective deployment. New profile branded share composites are build-generated; the runtime can use the CMS thumbnail before a composite exists. Social networks cache previews independently of Catalogue.

## Corrections, failures and retractions

- Correct the Sanity document, preserve identity, then verify after cache expiry. Urgent removal may require a Cloudflare cache purge.
- For historical Dispatch, also account for the bundled fallback before claiming a retraction is complete.
- Required CMS read failures return an error rather than proving publication. The homepage/index public data loader can fall back to the bundled Dispatch archive if its Dispatch request fails; the detail handler can return 503. Seeing an old homepage edition alone does not prove a new edition is missing from Sanity.
- Failed site checks block the X step. Failed X delivery does not require unpublishing the site. Check the bot ledger/account before retrying to avoid duplicate posts.

## Remaining operational evidence

Record the external bot repository/config location, owner, actual timezone/schedule, approval mechanism, retry policy and ledger location in an appropriate private runbook. None was available to this audit. Validate one approved new edition end to end (Sanity revision → public URL/index/sitemap → X URL) before asserting that tomorrow's scheduled run is guaranteed. Do not publish test news to establish this evidence.
