# DISPATCH on CATALOGUE

Current display and publication contract, reconciled 12 November 2026. The archive provenance below records the original 11 November recovery. The owner uses external Grok bots and Sanity; this repository implements the reading surfaces and schema, not the bot scheduler. See [Editorial publishing](EDITORIAL-PUBLISHING.md) for current delivery, timing and verification boundaries.

## Archive provenance

35 daily editions, 199 numbered stories, recovered verbatim from @CatalogueART's published long posts, dated 6 October–11 November 2026. No daily edition was found for 11 October or 8 November. One weekly recap is preserved in the raw evidence but excluded from the daily feed. Earlier ARTRECAP drafts are not treated as published.

`docs/review/dispatch-x-source.json` preserves all 36 source records including URLs, full text, actual publication timestamps and ordered media URLs. `src/data/dispatch-archive.json` contains 30 selected daily editions (164 stories / 120 images). At the user’s request, the five cover-only editions dated 6–10 October are removed from the site and draft import. Their original evidence remains in the raw source file. Issue dates come from their headings, not posting timestamps (the 1 November edition was posted on 2 November). Paragraph wording and handles remain unchanged; display headlines are split from each numbered paragraph's first sentence. The complete original text is retained in `body`.

Every recovered cover and plate is displayed in the edition's staggered image spread. Images open in a keyboard-accessible viewer, with previous/next, Escape and focus restoration. Archive thumbnails combine the cover (top left) and three highlight plates in a 2×2 grid. The landing page initially shared that component, then changed to the live-typed headline transcript during review; see [the session trajectory](SESSION-TRAJECTORY-2026-11-11.md). The cover remains the OG image. Published plate credits remain visible within the original images. The 11 November plates were visually verified against stories 01, 03 and 05 and also appear in those stories. Other historical plates stay in the edition image spread without guessing associations. No invented sources have been added. New editions support plates and credits on their actual story.

The historical source URLs currently use X's public image CDN. The bot's original 1200px media and off-X Sources packets were not available in this workspace. Source enrichment should use those original packets; do not manufacture citations from the prose. Importing into Sanity copies the recovered images into Sanity assets. Replace them with original masters where available.

## Sanity and backfill

The `dispatch` document is independent of `post`. Fields: title, issueDate, date slug, dateDisplay, dek, publishedAt, cover (alt/credit/sourceUrl), items (number/headline/body/sources/verified handles/plate/artist references/related post references), archived plates, original text and xPostUrl. Public queries explicitly exclude drafts and future publication dates. Published Sanity records override the bundled edition of the same date.

Preview the import: `node scripts/backfill-dispatch.mjs`.

After review, with the existing private write credential supplied through the environment: `node scripts/backfill-dispatch.mjs --write-drafts`. Requires `SANITY_API_TOKEN`; optional `SANITY_PROJECT_ID`, `SANITY_DATASET`. The importer uploads each public image, creates deterministic **drafts only**, skips existing draft/published IDs and never overwrites editorial changes or posts to X. It can be rerun after an interruption. Failed image uploads stop the import; retrying may leave unused Sanity assets, not duplicate published editions.

Before publishing historical drafts, review text/media and enrich Sources from the existing bot's records. Once all backfilled editions are published and validated, remove the bundled archive fallback in a separate reviewed change, so Sanity unpublishing controls removal completely. Until then, removing a Sanity record restores the verified historical fallback. To retract an edition during transition, remove its bundled entry as well.

## Publication contract: site first, X second

This is the required contract for the existing external DISPATCH bot, not a second scheduler. The initial brief referred to a 7:03 AM ET hunt; the actual current schedule/timezone and approval automation are outside this repository and remain unverified. Preserve the owner approval gate; do not infer scheduler configuration from this document.

1. Bot prepares the full edition, 5–8 numbered stories, verified handles, Sources for each item, a 1200px cover and three credited highlight plates attached to the correct stories. Store original media and text in the existing art-recap/catalogue-plates archive.
2. Bot creates/updates `drafts.dispatch-YYYY-MM-DD` in Sanity. Do not write the non-draft ID. Do not use the Content Lab publish endpoint. Set the slug and issueDate to the editorial date, and preserve the exact approved content.
3. Present the four images, full text, Sources and proposed time to Frédérick. Wait for his explicit approval. Changes after approval require renewed approval.
4. At the approved time, publish the Sanity document. The frontend reads only published content with a publication timestamp at or before now. Historical dates remain historical; new issue publication time is the actual release.
5. Verify `https://catalogue.gallery/dispatch/YYYY-MM-DD/`: HTTP 200; correct canonical; visible approved text and all media; matching OG/Twitter image; edition listed in `/dispatch/` and sitemap. Retry through the existing public cache window; never treat the SPA shell or an old page as success. Allow the full five-minute public HTML cache window plus request latency, then investigate persistent failures. A fixed three-minute wait is insufficient to prove freshness. Verify the homepage latest-edition link as well; existing open tabs need a reload.
6. Only after those checks, publish the already-approved X text/media once. Record the returned X URL in `xPostUrl` on the published Sanity document and in the bot's persistent publication ledger. Failed site checks block X. Failed X submission does not unpublish the site; check the account/ledger before retrying to prevent duplicates.

Required ledger key: `dispatch:YYYY-MM-DD`, with approved content revision/hash, approved time, Sanity document/revision, site verification time, X post ID/status. Never infer approval from a published document alone. Before a retry, verify that the approved content revision still matches.

This repository implements the schema and display, plus draft backfill tooling. The external Grokbot routines and their persistent ledger are outside this workspace and have **not** been modified. Verify the existing routine against this contract and record an approved end-to-end publication before claiming that its next scheduled run is guaranteed.

## Routes and SEO

- `/dispatch/`: searchable archive, newest editorial date first.
- `/dispatch/YYYY-MM-DD/`: full edition, all media, source links when supplied, artist/story references and adjacent issues.
- Landing sidebar: latest published edition in the Counterpoint transcript, with a single vertical title, neutral counter/background and lilac word reveals. Reduced motion shows all headlines statically. Read the edition opens the issue; All editions opens the archive. Presentation history and approval: [12 November report](SESSION-REPORT-2026-11-12.md).
- Dedicated public Pages Function for detail HTML, server-rendered text, canonical, Article schema, cover OG/Twitter image; published edition URLs included in the sitemap and static generation.
- Dispatch editions stay separate from the Stories `post` feed; cross-references may connect them.
- Ordinary new published editions are served without redeploying. Existing hydrated tabs do not automatically refresh. See [freshness and failures](EDITORIAL-PUBLISHING.md#does-new-content-need-a-deployment).
