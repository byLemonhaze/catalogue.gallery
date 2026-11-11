import { defineField } from 'sanity'
import { createCatalogueEntrySchema } from './catalogueEntrySchema'

const artist = createCatalogueEntrySchema({
    name: 'artist',
    title: 'Artist',
    subtitleDescription: 'Short discipline line shown in the artist profile modal, e.g. "Artist / AI" or "Generative Art & AI".',
    contentBioDescription: 'Auto-generated from artist website. Used by Content Lab as primary source for article/blog generation. Can be manually curated. Not shown in the artist profile modal; use shortBio for that.',
})

export default {
    ...artist,
    fieldsets: [
        {
            name: 'profileModal',
            title: 'Artist profile (modal)',
            description: 'Portrait and short bio for the upcoming artist profile modal. All fields are optional so existing documents stay valid.',
            options: {
                collapsible: false,
            },
        },
    ],
    fields: [
        ...artist.fields,
        defineField({
            name: 'portrait',
            type: 'image',
            fieldset: 'profileModal',
            description: 'Face portrait for the artist profile modal. Use a photo from the artist\'s own website or official press only. Do not reuse the work thumbnail unless that image is already a portrait of the artist. Not required.',
            options: {
                hotspot: true,
            },
            fields: [
                defineField({
                    name: 'alt',
                    type: 'string',
                    title: 'Alternative Text',
                    description: 'Describe the portrait for accessibility, e.g. "Portrait of Emily Xie".',
                    validation: (rule) =>
                        rule.custom((value, context) => {
                            const parent = context.parent as { asset?: unknown } | undefined
                            if (parent?.asset && !String(value ?? '').trim()) {
                                return 'Add alternative text when a portrait is set.'
                            }
                            return true
                        }),
                }),
                defineField({
                    name: 'credit',
                    type: 'string',
                    description: 'Photographer or rights credit when known.',
                }),
                defineField({
                    name: 'sourceUrl',
                    type: 'url',
                    title: 'Source URL',
                    description: 'Page on the artist\'s own website or official press where this portrait was found.',
                    validation: (rule) =>
                        rule.uri({ scheme: ['http', 'https'] }).custom((value, context) => {
                            const parent = context.parent as { asset?: unknown } | undefined
                            if (parent?.asset && !value) {
                                return 'Add the source URL of this portrait (artist\'s own site or official press).'
                            }
                            return true
                        }),
                }),
            ],
        }),
        defineField({
            name: 'shortBio',
            type: 'text',
            title: 'Short Bio',
            fieldset: 'profileModal',
            rows: 3,
            description: 'One or two sentences for the artist profile modal. Paraphrase only from the artist\'s own website. Never invent facts. Leave empty if no first-party source exists.',
            validation: (rule) => rule.max(300),
        }),
        defineField({
            name: 'bioSourceUrl',
            type: 'url',
            title: 'Bio Source URL',
            fieldset: 'profileModal',
            description: 'Page on the artist\'s own website that the short bio was drawn from. Required when shortBio is set.',
            validation: (rule) =>
                rule.uri({ scheme: ['http', 'https'] }).custom((value, context) => {
                    const bio = (context.document as { shortBio?: string } | undefined)?.shortBio
                    if (typeof bio === 'string' && bio.trim() && !value) {
                        return 'Add the source URL from the artist\'s own website when a short bio is present.'
                    }
                    return true
                }),
        }),
    ],
}
