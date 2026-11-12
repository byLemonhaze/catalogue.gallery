import type { Artist } from '../hooks/useArtists';
import { urlFor } from '../sanity/image';
export function profilePath(artist: Artist) {
    return `/${artist.type === 'gallery' || artist.type === 'collection' ? 'gallery' : 'artist'}/${encodeURIComponent(artist.id)}/`;
}
export function profileImage(artist: Artist, width = 900) {
    if (!artist.thumbnail)
        return undefined;
    return typeof artist.thumbnail === 'string' ? artist.thumbnail : urlFor(artist.thumbnail).width(width).auto('format').quality(80).url();
}
export function officialWebsite(value: string) {
    try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
    }
    catch {
        return undefined;
    }
}

/** Sanity asset IDs encode the uncropped source dimensions. */
export function profileAspect(artist: Artist) {
    const source = typeof artist.thumbnail === 'string' ? artist.thumbnail : artist.thumbnail?.asset?._ref;
    const match = source?.match(/-(\d+)x(\d+)(?:-|\.)/);
    if (!match) return undefined;
    const ratio = Number(match[1]) / Number(match[2]);
    return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined;
}
