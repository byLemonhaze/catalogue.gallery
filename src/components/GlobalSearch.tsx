import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { urlFor } from '../sanity/image';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';

interface GlobalSearchProps {
    search: string;
    setSearch: (val: string) => void;
    filteredArtists: Artist[];
    filteredArticles: ArticleRecord[];
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResultItemProps {
    artist: Artist;
    onSelect: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ artist, onSelect }) => (
    <a
        href={artist.type === 'gallery' ? `/gallery/${artist.id}` : `/artist/${artist.id}`}
        onClick={onSelect}
        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
    >
        <div className="w-8 h-8 flex-shrink-0 overflow-hidden bg-neutral-900 border border-white/8">
            {artist.thumbnail ? (
                <img
                    src={artist.isSanity ? urlFor(artist.thumbnail).width(80).url() : (artist.thumbnail as string)}
                    alt={artist.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0f0f0f]">
                    <span className="text-[10px] font-bold text-white/30 uppercase">{artist.name.charAt(0)}</span>
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-white truncate">{artist.name}</h3>
        </div>
        <div className="text-white/20 group-hover:text-white/50 transition-colors text-[10px]">→</div>
    </a>
);

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
    search, setSearch, filteredArtists, filteredArticles, isOpen, onClose
}) => {
    const location = useLocation();
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setSearch('');
        }
    }, [isOpen, setSearch]);

    // Esc to close
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Hide on artist pages
    const path = location.pathname;
    if (path.startsWith('/artist/') || path.startsWith('/gallery/')) return null;
    if (!isOpen) return null;

    const hasResults = filteredArtists.length > 0 || filteredArticles.length > 0;
    const artistsOnly = filteredArtists.filter(a => !a.type || a.type === 'artist');
    const galleriesOnly = filteredArtists.filter(a => a.type === 'gallery' || a.type === 'collection');
    const interviews = filteredArticles.filter(a => a.type === 'Interview');
    const articles = filteredArticles.filter(a => a.type !== 'Interview');

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/75 z-[60] backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Palette */}
            <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-[60] w-full max-w-lg px-4 animate-fade-in">
                <div className="bg-[#0d0d0d] border border-white/15 shadow-2xl overflow-hidden">

                    {/* Input */}
                    <div className="flex items-center gap-3 px-4 border-b border-white/10">
                        <span className="text-white/30 text-sm shrink-0">⌕</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search artists, galleries, articles..."
                            className="flex-1 py-4 bg-transparent text-white placeholder-white/25 focus:outline-none text-sm font-display tracking-wide"
                        />
                        <button
                            onClick={onClose}
                            className="text-white/25 hover:text-white transition-colors text-lg leading-none shrink-0 pl-2"
                            aria-label="Close search"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Results */}
                    {search && (
                        <div className="max-h-[50vh] overflow-y-auto">
                            {!hasResults ? (
                                <div className="py-8 text-center text-xs text-white/30 font-mono uppercase tracking-widest">
                                    No results
                                </div>
                            ) : (
                                <>
                                    {artistsOnly.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-white/3 text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">Artists</div>
                                            {artistsOnly.map(a => <SearchResultItem key={a.id} artist={a} onSelect={onClose} />)}
                                        </div>
                                    )}
                                    {galleriesOnly.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-white/3 text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">Galleries</div>
                                            {galleriesOnly.map(a => <SearchResultItem key={a.id} artist={a} onSelect={onClose} />)}
                                        </div>
                                    )}
                                    {interviews.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-white/3 text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">Interviews</div>
                                            {interviews.map(a => (
                                                <a key={a.id} href={`/blog/${a.id}`} onClick={onClose}
                                                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xs font-bold text-white truncate">{a.title}</h3>
                                                        <p className="text-[10px] text-white/30">Interview</p>
                                                    </div>
                                                    <div className="text-white/20 group-hover:text-white/50 text-[10px]">→</div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {articles.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-white/3 text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">Articles</div>
                                            {articles.map(a => (
                                                <a key={a.id} href={`/blog/${a.id}`} onClick={onClose}
                                                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xs font-bold text-white truncate">{a.title}</h3>
                                                        <p className="text-[10px] text-white/30">{a.type}</p>
                                                    </div>
                                                    <div className="text-white/20 group-hover:text-white/50 text-[10px]">→</div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Footer hint */}
                    {!search && (
                        <div className="px-4 py-3 text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
                            47 artists · galleries · interviews
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
