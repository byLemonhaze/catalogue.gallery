import { createCatalogueEntrySchema } from './catalogueEntrySchema'

export default createCatalogueEntrySchema({
    name: 'gallery',
    title: 'Gallery',
    subtitleDescription: 'Short snippet, e.g. "Verse, Sovrn, Art Blocks etc."',
    contentBioDescription: 'Auto-generated from website. Used by Content Lab as primary source for article/blog generation. Can be manually curated.',
})
