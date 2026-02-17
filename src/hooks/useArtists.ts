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

    useEffect(() => {
        // If we have cache, we don't need to fetch immediately, but we can re-validate silently if needed.
        // For now, just relying on cache is enough to solve the scroll jump.
        if (globalCache) return;

        async function fetchArtists() {
            try {
                // Fetch artist, gallery, and collector document types (only published or legacy items)
                const sanityData = await client.fetch(`*[_type in ["artist", "gallery", "collector"] && (status == "published" || !defined(status))] | order(name asc) {
                    "id": coalesce(slug.current, _id),
                    "type": _type,
                    name,
                    subtitle,
                    websiteUrl,
                    thumbnail,
                    template,
                    desktopExitPosition,
                    mobileExitPosition
                }`);

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

                // Manual Injection: Robness
                // This ensures auto-linking works even if he's not in Sanity yet
                if (!mappedSanity.find((a: any) => a.name === 'Robness')) {
                    mappedSanity.push({
                        id: 'robness',
                        name: 'Robness',
                        subtitle: 'Trash Art',
                        thumbnail: '/robness.png',
                        type: 'artist',
                        template: '1', // Default template
                        desktopExitPosition: 'top-center',
                        mobileExitPosition: 'top-center',
                        isSanity: false
                    });
                }

                setArtists(mappedSanity);
                globalCache = mappedSanity; // Update cache
            } catch (err) {
                console.error('Failed to fetch Sanity artists:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchArtists();
    }, []);

    return { artists, loading };
}
