
import React from 'react';
import { Link } from 'react-router-dom';

// Define the Artist interface (matching the JSON structure)
interface Artist {
    id: string;
    name: string;
    thumbnail: any;
    subtitle: string;
    websiteUrl?: string;
    isSanity?: boolean;
    type?: string;
}

import { Helmet } from 'react-helmet-async';

import { useArtists } from '../hooks/useArtists';
import { urlFor } from '../sanity/image';

export const ArtistList: React.FC = () => {
    const { artists, loading, error } = useArtists();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen pt-24">
            <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
    );

    if (!artists.length) {
        return (
            <div className="min-h-screen bg-black text-white pt-24 px-6">
                <div className="max-w-xl mx-auto border border-white/10 p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Unable to load directory</p>
                    <p className="mt-3 text-sm text-white/50">{error || 'Could not reach Sanity right now.'}</p>
                    <p className="mt-2 text-xs text-white/35">
                        If testing from phone on local dev, add this origin in Sanity CORS:{' '}
                        <span className="font-mono">{window.location.origin}</span>
                    </p>
                </div>
            </div>
        );
    }

    const artistItems = artists.filter(a => a.type === 'artist' || !a.type);
    const galleries = artists.filter(a => a.type === 'gallery' || (a as any).type === 'collection');

    const sortedArtists = [...artistItems].sort((a, b) => a.name.localeCompare(b.name));

    const groupedArtists: { [key: string]: Artist[] } = {};
    sortedArtists.forEach(artist => {
        const firstLetter = artist.name.charAt(0).toUpperCase();
        if (!groupedArtists[firstLetter]) {
            groupedArtists[firstLetter] = [];
        }
        groupedArtists[firstLetter].push(artist as any);
    });

    const letters = Object.keys(groupedArtists).sort();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet>
                <title>Directory | CATALOGUE</title>
            </Helmet>

            <div className="pt-28 md:pt-24 px-6 max-w-4xl mx-auto pb-32">

                {/* Page Header */}
                <div className="mb-16 md:mb-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Directory</p>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none text-white">
                        Artists & Galleries
                    </h1>
                </div>

                {/* Artists */}
                <section className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Artists</p>
                        <div className="h-px flex-1 bg-white/8" />
                        <p className="text-[10px] font-mono text-white/20">{sortedArtists.length}</p>
                    </div>

                    {letters.map(letter => (
                        <div key={letter} className="mb-8">
                            {/* Letter Divider */}
                            <div className="flex items-center gap-4 mb-1 py-2 border-b border-white/10">
                                <span className="text-[10px] font-bold tracking-[0.3em] text-white/20">{letter}</span>
                            </div>

                            {groupedArtists[letter].map(artist => (
                                <Link
                                    key={artist.id}
                                    to={`/artist/${artist.id}`}
                                    state={{ from: 'directory' }}
                                    className="group flex items-center gap-4 py-3 border-b border-white/6 hover:border-white/20 transition-colors duration-200"
                                >
                                    <div className="w-10 h-10 shrink-0 overflow-hidden bg-white/5">
                                        {artist.thumbnail ? (
                                            <img
                                                src={artist.isSanity ? urlFor(artist.thumbnail).width(80).url() : artist.thumbnail}
                                                alt={artist.name}
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-white/20 uppercase">{artist.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate tracking-tight group-hover:text-white/80 transition-colors">
                                            {artist.name}
                                        </p>
                                        <p className="text-[11px] text-white/35 truncate mt-0.5">
                                            {artist.subtitle}
                                        </p>
                                    </div>
                                    <span className="text-white/20 group-hover:text-white/50 transition-colors text-sm pr-1">→</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </section>

                {/* Galleries */}
                {galleries.length > 0 && (
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Galleries</p>
                            <div className="h-px flex-1 bg-white/8" />
                            <p className="text-[10px] font-mono text-white/20">{galleries.length}</p>
                        </div>

                        {galleries.map(gallery => (
                            <Link
                                key={gallery.id}
                                to={`/gallery/${gallery.id}`}
                                state={{ from: 'directory' }}
                                className="group flex items-center gap-4 py-3 border-b border-white/6 hover:border-white/20 transition-colors duration-200"
                            >
                                <div className="w-12 h-12 shrink-0 overflow-hidden bg-white/5">
                                    {gallery.thumbnail ? (
                                        <img
                                            src={gallery.isSanity ? urlFor(gallery.thumbnail).width(100).url() : gallery.thumbnail}
                                            alt={gallery.name}
                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-base font-black text-white/15 uppercase">{gallery.name.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-black text-white truncate tracking-tight group-hover:text-white/80 transition-colors">
                                        {gallery.name}
                                    </p>
                                    <p className="text-[11px] text-white/35 truncate mt-0.5">
                                        {gallery.subtitle}
                                    </p>
                                </div>
                                <span className="text-white/20 group-hover:text-white/50 transition-colors text-sm pr-1">→</span>
                            </Link>
                        ))}
                    </section>
                )}

                {/* Collectors */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Collectors</p>
                        <div className="h-px flex-1 bg-white/8" />
                    </div>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] py-6 border-b border-white/6">
                        Coming soon
                    </p>
                </section>

            </div>
        </div>
    );
};
