# Windows redesign implementation

Branch: `feat/windows-redesign`. Based on the approved Windows #10 study and the full-site brief of 11 November 2026.

## Implemented

- The homepage uses the study's interpolated resizing carousel with a short introduction and one Content Lab lead on the right. Recent stories and editor picks follow in the normal page scroll. Editorial selection still comes from the existing CMS selection and deduplication code.
- Horizontal trackpad gestures, touch swipes, a range control, one previous/next pair and keyboard navigation browse the full artist payload. Vertical gestures remain page scrolling. Only adjacent preview windows mount. Motion can be reduced, and the system preference is respected.
- The directory offers search, artist/gallery filters and grid/list views. Its initial server-rendered output contains links to the complete inventory.
- Profile links open an accessible native dialog using React Router background locations. The URL remains `/artist/{slug}/` or `/gallery/{slug}/`. Direct visits and refreshes render a complete page. Closing the dialog restores focus. The background remains mounted through world entry and return.
- Embedded worlds now live at `/artist/{slug}/world/` and `/gallery/{slug}/world/`. Cloudflare handlers validate the profile and provide its bootstrap for direct entry. These routes are noindex with a canonical to the public profile. Existing profile slugs are preserved.
- Public profile HTML is rendered at build time and by the existing dynamic response pipeline, with an H1, description/bio, official link and world-entry link. Website embedding starts only after entry.
- Navigation uses real destination links. Search is keyboard accessible and uses a native dialog. Reading, About and Apply pages share the paper palette and typography. Application validation, submission, private data and mail handling are unchanged.

## Public biography contract

Sanity artist/gallery schemas now have an optional `shortBio` text field. This is explicitly reviewed public copy. The existing `contentBio` research field is not projected into the public UI.

The biography agent can deliver `{id or existing slug, shortBio, sources, review status}`. Publish reviewed copy into `shortBio` using the existing CMS workflow. Until then the profile displays its existing subtitle without an invented bio or a placeholder announcement. Deploy the Studio schema before expecting the field in the editor. No CMS records were changed by this implementation.

## Validation

Verified on 11 November 2026: `npm run verify` passed lint, TypeScript and all 157 tests across 21 suites. `npm run build --ignore-scripts` passed both client and server compilation. The complete `npm run build` remains blocked at its network-dependent postbuild step.

Run `npm run verify` for lint, TypeScript and tests. New coverage exercises overlay/open/close/world/back behavior, focus restoration, standalone profile entry, directory search, server-rendered profile text, motion continuity and world-route metadata.

Run `npm run build` from a network-enabled terminal. The client and server bundlers compile locally. The postbuild script requires `tsx` through the existing npx command and access to public Sanity content/image endpoints. It must complete before deployment; partial `dist` output is not a release artifact.

This execution environment could not bind the local preview port (`EPERM`) or resolve the registry for the postbuild runner. Browser layout, mobile touch behavior, live-content postbuild and deployed Functions verification remain outstanding. Automated DOM tests are not a substitute for this visual review.

## Preview and review

From the repository root:

```sh
npm run dev -- --host 127.0.0.1
```

Use the URL Vite prints. Check desktop and mobile home, a populated directory, profile open/close, direct profile refresh, world entry/back, Content Lab, an article, About and Apply. Use keyboard-only navigation and reduced motion. Check vertical/diagonal touch gestures and horizontal artist browsing separately. Do not submit test applications to the production API.

Before release, run the complete network-enabled build, validate deployed profile/world direct links and new Functions paths, check the real artist images and missing-image states, inspect Search Console coverage and review performance. Publish a preview branch for design review before merging. Keep the existing private admin and email configuration.
