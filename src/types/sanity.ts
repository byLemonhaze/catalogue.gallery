// Minimal Sanity image object as returned by GROQ field projections
export type SanityImageAsset = {
    _ref: string
    _type: 'reference'
}

export type SanityImageObject = {
    _type: 'image'
    asset: SanityImageAsset
    [key: string]: unknown
}

// A thumbnail field can be a Sanity image object, a plain URL string, or absent
export type ThumbnailSource = SanityImageObject | string | null | undefined
