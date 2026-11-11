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
