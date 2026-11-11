# Artist profile fields

These fields feed an upcoming artist profile modal (large portrait, name, discipline line, short bio, "Enter world" link, and "Keep exploring" thumbnails). The modal is not in production yet. This document is the source of truth for the Sanity fields and the sourcing rules a future prep bot must follow.

All new fields are optional, so existing artist documents stay valid.

## Reused fields

Do not add duplicates of these.

| Field | Type | Role |
|---|---|---|
| `name` | string | Artist name in the modal. |
| `subtitle` | string | Discipline line in the modal, e.g. `Artist / AI` or `Generative Art & AI`. |
| `websiteUrl` | url | Target of the "Enter world" link. |
| `thumbnail` | image (hotspot) | Directory / "Keep exploring" card image. This is usually artwork, not a face portrait. |
| `contentBio` | text | Long research bio for Content Lab article generation. Do not show this in the modal and do not overwrite it when writing `shortBio`. |

## New artist-only fields

These exist on `artist` documents only, not on galleries.

| Field | Type | Validation | Role |
|---|---|---|---|
| `portrait` | image, with hotspot | Optional. If an image is set, `alt` and `sourceUrl` are required. | Large face portrait in the modal. |
| `portrait.alt` | string | Required when `portrait` is set. | Accessible alternative text, e.g. `Portrait of Emily Xie`. |
| `portrait.credit` | string | Optional. | Photographer or rights credit when known. |
| `portrait.sourceUrl` | url (`http`/`https`) | Required when `portrait` is set. | Page on the artist's own website or official press where the photo was found. |
| `shortBio` | text | Optional, max 300 characters (about one or two sentences). | Modal bio. |
| `bioSourceUrl` | url (`http`/`https`) | Required when `shortBio` is set. | Page on the artist's own website that the short bio was drawn from. |

There is no stored `discipline` field. Use `subtitle`.

There is no stored `profilePrepStatus` field. It would go stale. Derive it when querying:

```groq
*[_type == "artist"]{
  _id,
  name,
  "profilePrepStatus": select(
    !defined(portrait.asset) && !(defined(shortBio) && shortBio != "") => "missing-photo-and-bio",
    !defined(portrait.asset) => "missing-photo",
    !(defined(shortBio) && shortBio != "") => "missing-bio",
    "ready"
  )
}
```

## Sourcing rules

These rules are mandatory for editors and for any bot that prepares these fields.

1. **Portrait** may come only from the artist's own website or official press kit / press page. Do not use social avatars, third-party blogs, screenshots, generated faces, or unrelated photos.
2. **Do not invent a portrait.** If no first-party photo of the artist is available, leave `portrait` empty.
3. **Do not silently reuse `thumbnail` as `portrait`** unless that thumbnail is already a photograph of the artist's face.
4. Every portrait must have accurate `alt` text and a `sourceUrl` pointing at the page the file was taken from. Add `credit` when a photographer or rights line is published with the photo.
5. **`shortBio` may only paraphrase the artist's own website.** Do not invent biographical facts, dates, affiliations, or claims that are not on that site. Do not copy a long research dump from `contentBio` into the modal unless that text is itself a short, first-party bio and still fits the 300-character limit after editing.
6. If the artist's site has no usable bio, leave `shortBio` empty. A missing bio is better than a guessed one.
7. When `shortBio` is present, `bioSourceUrl` is required and must be a page on the artist's own site.
8. Bots should write **unpublished drafts only**. A human publishes.

## Modal mapping

| Modal UI | Sanity field |
|---|---|
| Large portrait | `portrait` (with hotspot crop) |
| Artist name | `name` |
| Discipline line (`Artist / AI`) | `subtitle` |
| Short biography | `shortBio` |
| "Enter world" | `websiteUrl` |
| "Keep exploring" thumbnails | other artists' `thumbnail` images |

The public frontend does not read the new fields yet. Shipping the modal is a separate change, after this schema is reviewed and the Studio has been deployed.

## Deploy and content notes

- Merging this pull request does not deploy Studio or write any artist documents.
- Studio must be deployed before the new fields appear in the hosted Studio UI.
- Frontend queries and types for the modal should be added later, once the schema is live.
