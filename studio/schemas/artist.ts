import { createCatalogueEntrySchema } from './catalogueEntrySchema'

export default createCatalogueEntrySchema({
    name: 'artist',
    title: 'Artist',
    subtitleDescription: 'Short snippet, e.g. "Generative Art & AI"',
    contentBioDescription: 'Auto-generated from artist website. Used by Content Lab as primary source for article/blog generation. Can be manually curated.',
})
