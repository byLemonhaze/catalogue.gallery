
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
        <div className="flex items-center justify-center min-h-screen pt-40">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
    );

    if (!artists.length) {
        return (
            <div className="min-h-screen bg-black text-white pt-44 px-6">
                <div className="max-w-xl mx-auto border border-white/10 bg-white/[0.02] rounded-2xl p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Unable to load directory</p>
                    <p className="mt-3 text-sm text-white/50">{error || 'Could not reach Sanity right now.'}</p>
                    <p className="mt-2 text-xs text-white/35">
                        If testing from phone on local dev, add this origin in Sanity CORS:
                        {' '}
                        <span className="font-mono">{window.location.origin}</span>
                    </p>
                </div>
            </div>
        );
    }

    // Sort artists alphabetically (regular artists only)
    const artistItems = artists.filter(a => a.type === 'artist' || !a.type);
    const galleries = artists.filter(a => a.type === 'gallery' || (a as any).type === 'collection');

    const sortedArtists = [...artistItems].sort((a, b) => a.name.localeCompare(b.name));

    // Group artists by first letter
    const groupedArtists: { [key: string]: Artist[] } = {};
    sortedArtists.forEach(artist => {
        const firstLetter = artist.name.charAt(0).toUpperCase();
        if (!groupedArtists[firstLetter]) {
            groupedArtists[firstLetter] = [];
        }
        groupedArtists[firstLetter].push(artist as any);
    });

    // Get sorted keys (letters)
    // Get sorted keys (letters)
    const letters = Object.keys(groupedArtists).sort();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <Helmet>
                <title>Directory | CATALOGUE</title>
            </Helmet>

            <div className="pt-44 md:pt-40 p-6 max-w-7xl mx-auto min-h-screen space-y-24">

                {/* Individual Artists Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Artists</h2>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>

                    <div className="space-y-12">
                        {letters.map(letter => (
                            <div key={letter} className="relative">
                                <div className="sticky top-24 z-10 bg-black/90 backdrop-blur-sm py-2 border-b border-white/10 mb-4 flex items-center gap-4">
                                    <h2 className="text-xl font-black text-white/20">{letter}</h2>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedArtists[letter].map(artist => (
                                        <Link
                                            key={artist.id}
                                            to={`/artist/${artist.id}`}
                                            state={{ from: 'directory' }}
                                            className="group flex items-center gap-4 p-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-900 border border-white/5">
                                                {artist.thumbnail ? (
                                                    <img
                                                        src={artist.isSanity ? urlFor(artist.thumbnail).width(100).url() : artist.thumbnail}
                                                        alt={artist.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-black">
                                                        <span className="text-xl font-bold text-white/20 uppercase">{artist.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 truncate transition-colors">
                                                    {artist.name}
                                                </h3>
                                                <p className="text-xs text-white/40 font-mono truncate">
                                                    {artist.subtitle}
                                                </p>
                                            </div>
                                            <div className="pr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all font-mono text-xs text-white/30">
                                                →
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Galleries Section */}
                {galleries.length > 0 && (
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Galleries</h2>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {galleries.map(gallery => (
                                <Link
                                    key={gallery.id}
                                    to={`/gallery/${gallery.id}`}
                                    state={{ from: 'directory' }}
                                    className="group flex items-center gap-4 p-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 cursor-pointer"
                                >
                                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-900 border border-white/5">
                                        {gallery.thumbnail ? (
                                            <img
                                                src={gallery.isSanity ? urlFor(gallery.thumbnail).width(120).url() : gallery.thumbnail}
                                                alt={gallery.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-black">
                                                <span className="text-2xl font-black text-white/10 uppercase">{gallery.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-black text-white group-hover:text-purple-300 truncate transition-colors tracking-tight">
                                            {gallery.name}
                                        </h3>
                                        <p className="text-xs text-white/40 font-mono truncate">
                                            {gallery.subtitle}
                                        </p>
                                    </div>
                                    <div className="pr-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all font-mono text-xs text-white/30">
                                        →
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Collectors Section (Coming Soon) */}
                <section className="space-y-8 pb-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Collectors</h2>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>

                    <div className="py-12 border border-white/5 bg-white/[0.02] rounded-2xl text-center">
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">
                            Coming soon
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};
