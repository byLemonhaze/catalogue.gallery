import { useState, useEffect } from 'react';
import { client } from '../sanity/client';
import type { SanityImageObject } from '../types/sanity';

// Raw shape returned by the GROQ query
type SanityArtistRaw = {
    id: string;
    type: 'artist' | 'gallery' | 'collector';
    name: string;
    subtitle: string;
    websiteUrl: string;
    thumbnail: SanityImageObject | null;
    template?: string;
    desktopExitPosition?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left';
    mobileExitPosition?: 'bottom-center' | 'top-right' | 'top-left' | 'top-center';
};

export interface Artist {
    id: string;
    name: string;
    subtitle: string;
    websiteUrl: string;
    thumbnail: SanityImageObject | string | null | undefined;
    isSanity?: boolean;
    type?: 'artist' | 'gallery' | 'collector' | 'collection';
    template?: string;
    provenanceUrl?: string;
    desktopExitPosition?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left';
    mobileExitPosition?: 'bottom-center' | 'top-right' | 'top-left' | 'top-center';
}

// Cache a successful result and the in-flight request separately. Failures remain retryable.
let artistCache: Artist[] | null = null;
let pending: Promise<Artist[]> | null = null;
function fetchArtists(): Promise<Artist[]> {
    if (artistCache) return Promise.resolve(artistCache);
    if (pending) return pending;
    const query = `*[_type in ["artist", "gallery", "collector"] && (status == "published" || !defined(status))] | order(name asc) {
        "id": coalesce(slug.current, _id), "type": _type, name, subtitle, websiteUrl, thumbnail,
        template, desktopExitPosition, mobileExitPosition
    }`;
    pending = (async () => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            const data = await Promise.race([
                client.fetch<SanityArtistRaw[]>(query, {}, { signal: controller.signal }),
                new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Artist request timed out')); }, 10000); }),
            ]);
            if (!Array.isArray(data)) throw new Error('Unexpected Sanity response');
            const mapped = data.map(artist => ({ ...artist, isSanity: true }));
            artistCache = mapped;
            return mapped;
        } finally { clearTimeout(timer); pending = null; }
    })();
    return pending;
}
export function useArtists(enabled = true) {
    const [artists, setArtists] = useState<Artist[]>(artistCache || []);
    const [loading, setLoading] = useState(!artistCache);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        fetchArtists().then(data => {
            if (cancelled) return;
            setArtists(data);
            setError(data.length ? null : 'No artists were returned from Sanity.');
        }).catch(() => {
            if (!cancelled) setError('Could not load artist data from Sanity.');
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [enabled]);
    return { artists, loading: enabled && loading, error };
}
