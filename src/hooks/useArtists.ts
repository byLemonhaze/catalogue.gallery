import { useState, useEffect } from 'react';
import { client } from '../sanity/client';

export interface Artist {
    id: string;
    name: string;
    subtitle: string;
    websiteUrl: string;
    thumbnail: any; // Can be string (local) or Sanity image object
    isSanity?: boolean;
    type?: 'artist' | 'gallery' | 'collector' | 'collection';
    desktopExitPosition?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left';
    mobileExitPosition?: 'bottom-center' | 'top-right' | 'top-left' | 'top-center';
}

// Simple in-memory cache to preserve data across navigation and restore scroll position
let globalCache: Artist[] | null = null;

export function useArtists() {
    const [artists, setArtists] = useState<Artist[]>(globalCache || []);
    const [loading, setLoading] = useState(!globalCache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If we have cache, we don't need to fetch immediately, but we can re-validate silently if needed.
        // For now, just relying on cache is enough to solve the scroll jump.
        if (globalCache) return;

        async function fetchArtists() {
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
                // Fetch artist, gallery, and collector document types (only published or legacy items)
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
                    client.fetch(query),
                    timeoutPromise,
                ]) as any[];

                if (!Array.isArray(sanityData)) {
                    throw new Error('Unexpected Sanity response');
                }

                const mappedSanity = sanityData.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    subtitle: a.subtitle,
                    websiteUrl: a.websiteUrl,
                    thumbnail: a.thumbnail,
                    type: a.type, // Now directly from _type
                    template: a.template, // Added template
                    desktopExitPosition: a.desktopExitPosition,
                    mobileExitPosition: a.mobileExitPosition,
                    isSanity: true
                }));

                setArtists(mappedSanity);
                if (mappedSanity.length > 0) {
                    globalCache = mappedSanity; // Update cache only when data exists
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
