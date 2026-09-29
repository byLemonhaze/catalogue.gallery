import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { client } from './client'

// Keep image delivery on Sanity's image CDN, including during proxied local reads.
const { projectId, dataset } = client.config()
const builder = createImageUrlBuilder({ projectId: projectId!, dataset: dataset! })

export function urlFor(source: SanityImageSource) {
    return builder.image(source)
}
