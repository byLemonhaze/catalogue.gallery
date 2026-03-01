import React from 'react';
import { useLocation } from 'react-router-dom';
import { urlFor } from '../sanity/image';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';

interface GlobalSearchProps {
    search: string;
    setSearch: (val: string) => void;
    filteredArtists: Artist[];
    filteredArticles: ArticleRecord[];
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
        <div className="w-8 h-8 flex-shrink-0  overflow-hidden bg-neutral-900 border border-white/8">
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
            <h3 className="text-xs font-bold text-white group-hover:text-white truncate transition-colors">
                {artist.name}
            </h3>
        </div>
        <div className="text-white/20 group-hover:text-white/50 transition-colors text-[10px]">→</div>
    </a>
);

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ search, setSearch, filteredArtists, filteredArticles }) => {
    const location = useLocation();
    const path = location.pathname;

    // Hide search on artist, info, submission, and builder pages
    if (path.startsWith('/artist/') || path === '/info' || path === '/submit' || path === '/build') return null;

    return (
        <>
            <div className="fixed top-32 md:top-32 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
                <div className="w-full max-w-md pointer-events-auto animate-fade-in relative">
                    <div className="relative group">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="SEARCH..."
                            className="w-full px-5 py-3 bg-[#0c0c0c] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-[#101010] transition-all text-base md:text-xs font-bold uppercase tracking-widest"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        )}

                        {/* Dropdown Results */}
                        {search && (filteredArtists.length > 0 || filteredArticles.length > 0) && (
                            <div className="absolute top-full mt-2 w-full bg-[#070707] border border-white/10 overflow-hidden shadow-2xl max-h-[60vh] overflow-y-auto custom-scrollbar">

                                {/* Categorize Artists by Type */}
                                {(() => {
                                    const artistsOnly = filteredArtists.filter(a => !a.type || a.type === 'artist');
                                    const galleriesOnly = filteredArtists.filter(a => a.type === 'gallery' || a.type === 'collection');
                                    const collectorsOnly = filteredArtists.filter(a => a.type === 'collector');

                                    return (
                                        <>
                                            {/* ARTISTS */}
                                            {artistsOnly.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 z-10">
                                                        Artists
                                                    </div>
                                                    {artistsOnly.map((artist) => (
                                                        <SearchResultItem key={'artist-' + artist.id} artist={artist} onSelect={() => setSearch('')} />
                                                    ))}
                                                </div>
                                            )}

                                            {/* GALLERIES */}
                                            {galleriesOnly.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 border-t border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 z-10">
                                                        Galleries
                                                    </div>
                                                    {galleriesOnly.map((artist) => (
                                                        <SearchResultItem key={'gallery-' + artist.id} artist={artist} onSelect={() => setSearch('')} />
                                                    ))}
                                                </div>
                                            )}

                                            {/* COLLECTORS */}
                                            {collectorsOnly.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 border-t border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 z-10">
                                                        Collectors
                                                    </div>
                                                    {collectorsOnly.map((artist) => (
                                                        <SearchResultItem key={'collector-' + artist.id} artist={artist} onSelect={() => setSearch('')} />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* INTERVIEWS */}
                                {filteredArticles.some(a => a.type === 'Interview') && (
                                    <div>
                                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 border-t border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 z-10">
                                            Interviews
                                        </div>
                                        {filteredArticles.filter(a => a.type === 'Interview').map((article) => (
                                            <a
                                                key={'interview-' + article.id}
                                                href={`/blog/${article.id}`}
                                                onClick={() => setSearch('')}
                                                className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                                            >
                                                {/* Q&A / Chat Icon */}
                                                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center  bg-white/5 border border-white/8 text-white/60 group-hover:text-white transition-colors">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xs font-bold text-white group-hover:text-white truncate transition-colors">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-[10px] text-white/40 truncate">Conversation</p>
                                                </div>
                                                <div className="text-white/20 group-hover:text-white/50 transition-colors text-[10px]">→</div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* ARTICLES (Blog & Articles) */}
                                {filteredArticles.some(a => a.type !== 'Interview') && (
                                    <div>
                                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 border-t border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 z-10">
                                            Articles
                                        </div>
                                        {filteredArticles.filter(a => a.type !== 'Interview').map((article) => (
                                            <a
                                                key={'article-' + article.id}
                                                href={`/blog/${article.id}`}
                                                onClick={() => setSearch('')}
                                                className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                                            >
                                                {/* Manuscript / Paper Icon */}
                                                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center  bg-white/5 border border-white/8 text-white/60 group-hover:text-white transition-colors">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                        <polyline points="10 9 9 9 8 9"></polyline>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xs font-bold text-white group-hover:text-white truncate transition-colors">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-[10px] text-white/40 truncate">{article.type}</p>
                                                </div>
                                                <div className="text-white/20 group-hover:text-white/50 transition-colors text-[10px]">→</div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {search && filteredArtists.length === 0 && filteredArticles.length === 0 && (
                            <div className="absolute top-full mt-2 w-full bg-[#070707] border border-white/10 p-4 text-center">
                                <p className="text-xs text-white/40 font-mono">No results found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop overlay when search is active */}
            {search && (
                <div
                    className="fixed inset-0 bg-black/65 z-30 transition-opacity"
                    onClick={() => setSearch('')}
                />
            )}
        </>
    );
};
