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

// Module-level cache — avoids redundant Sanity fetches across navigation.
// Reset with vi.resetModules() in tests, or migrate to React Query for a proper solution.
let artistCache: Artist[] | null = null;

export function useArtists() {
    const [artists, setArtists] = useState<Artist[]>(artistCache || []);
    const [loading, setLoading] = useState(!artistCache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (artistCache) return;

        async function fetchArtists() {
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
                const query = `*[_type in ["artist", "gallery", "collector"] && (status == "published" || !defined(status))] | order(name asc) {
                    "id": coalesce(slug.current, _id),
                    "type": _type,
                    name,
                    subtitle,
                    websiteUrl,
                    thumbnail,
                    template,
                    desktopExitPosition,
                    mobileExitPosition
                }`;
                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error('Sanity fetch timed out')), 10000);
                });

                const sanityData = await Promise.race([
                    client.fetch<SanityArtistRaw[]>(query),
                    timeoutPromise,
                ]);

                if (!Array.isArray(sanityData)) {
                    throw new Error('Unexpected Sanity response');
                }

                const mappedSanity: Artist[] = sanityData.map((a) => ({
                    id: a.id,
                    name: a.name,
                    subtitle: a.subtitle,
                    websiteUrl: a.websiteUrl,
                    thumbnail: a.thumbnail,
                    type: a.type,
                    template: a.template,
                    desktopExitPosition: a.desktopExitPosition,
                    mobileExitPosition: a.mobileExitPosition,
                    isSanity: true,
                }));

                setArtists(mappedSanity);
                if (mappedSanity.length > 0) {
                    artistCache = mappedSanity;
                }
                setError(mappedSanity.length === 0 ? 'No artists were returned from Sanity.' : null);
            } catch (err) {
                console.error('Failed to fetch Sanity artists:', err);
                setArtists([]);
                setError('Could not load artist data from Sanity.');
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
                setLoading(false);
            }
        }

        fetchArtists();
    }, []);

    return { artists, loading, error };
}
