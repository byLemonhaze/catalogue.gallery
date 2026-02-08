import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// Interfaces (duplicated to maintain independence as requested)
interface TemplateItem {
    artist_name: string;
    collection_name: string;
    collection_description: string;
    inscription_id: string;
    artwork_title: string;
    year: string;
}

interface Artist {
    id: string;
    name: string;
    subtitle: string;
    template?: string;
    provenanceUrl?: string;
}

export const PortfolioTemplateV2: React.FC<{ artist: Artist }> = ({ artist }) => {
    const [artworks, setArtworks] = useState<TemplateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtwork, setSelectedArtwork] = useState<TemplateItem | null>(null);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            if (!artist.provenanceUrl) return;
            try {
                const res = await fetch(artist.provenanceUrl);
                const items: TemplateItem[] = await res.json();
                // Sort by Year (Desc)
                const sorted = items.sort((a, b) => Number(b.year) - Number(a.year));
                setArtworks(sorted);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load on-chain data", err);
                setLoading(false);
            }
        };
        loadData();
    }, [artist]);

    // Group for the feed? Or just flat feed?
    // Let's do a grouped feed by year to give some structure to the scroll
    const groupedArtworks = useMemo(() => {
        const groups: Record<string, TemplateItem[]> = {};
        artworks.forEach(a => {
            const y = a.year || 'Unknown';
            if (!groups[y]) groups[y] = [];
            groups[y].push(a);
        });
        return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
    }, [artworks]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 tracking-widest uppercase text-xs">Loading Archive...</div>;

    return (
        <div className="flex h-screen bg-black overflow-hidden selection:bg-white selection:text-black">

            {/* LEFT PANEL - FIXED MANIFESTO (40%) */}
            <div className="hidden lg:flex w-[40%] flex-col justify-between p-12 border-r border-white/10 relative z-10">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white hover:opacity-50 transition-opacity">
                        CATALOGUE
                    </Link>
                    <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
                        Exit View ↗
                    </Link>
                </div>

                {/* Center - MASSIVE Name */}
                <div className="my-auto">
                    <h1 className="text-8xl xl:text-9xl font-black text-white leading-[0.8] tracking-tighter -ml-1 break-words">
                        {artist.name.toUpperCase()}
                    </h1>
                    <div className="mt-8 h-px w-24 bg-white/20"></div>
                    <p className="mt-8 text-sm text-white/60 leading-relaxed font-mono max-w-md">
                        {artist.subtitle}
                    </p>
                </div>

                {/* Footer Metadata */}
                <div className="flex gap-12 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
                    <div>
                        <span className="block text-white/20 mb-1">Born</span>
                        <span>Digital</span>
                    </div>
                    <div>
                        <span className="block text-white/20 mb-1">Status</span>
                        <span>Archived</span>
                    </div>
                    <div>
                        <span className="block text-white/20 mb-1">Works</span>
                        <span>{artworks.length}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - SCROLLING FEED (60%) */}
            <div className="flex-1 h-full overflow-y-auto bg-[#0a0a0a] smooth-scroll">
                <div className="min-h-full">

                    {/* Mobile Header (Visible only on small screens) */}
                    <div className="lg:hidden p-6 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur z-50 flex justify-between items-center">
                        <span className="font-bold text-white">{artist.name}</span>
                        <Link to="/" className="text-xs uppercase text-white/50">Exit</Link>
                    </div>

                    {/* Feed */}
                    <div className="p-4 md:p-12 space-y-24">
                        {groupedArtworks.map(([year, items]) => (
                            <div key={year}>
                                {/* Year Marker */}
                                <div className="sticky top-0 lg:static z-40 py-4 bg-[#0a0a0a]/90 backdrop-blur lg:bg-transparent mb-8 border-b border-white/10 lg:border-none">
                                    <h2 className="text-4xl md:text-[6rem] font-black text-white/5 leading-none select-none">
                                        {year}
                                    </h2>
                                </div>

                                {/* Masonry-ish Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    {items.map((item) => (
                                        <div
                                            key={item.inscription_id}
                                            onClick={() => setSelectedArtwork(item)}
                                            className="group relative cursor-pointer"
                                        >
                                            <div className="relative aspect-square bg-[#111] overflow-hidden">
                                                <img
                                                    src={`https://ordinals.com/content/${item.inscription_id}`}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                                    loading="lazy"
                                                />
                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                                    <p className="text-white font-bold text-xl italic">{item.artwork_title}</p>
                                                    <p className="text-white/50 text-xs font-mono uppercase mt-1">{item.collection_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer padding */}
                    <div className="h-32 flex items-center justify-center text-white/10 text-xs uppercase tracking-widest">
                        End of Archive
                    </div>
                </div>
            </div>

            {/* MODAL (Reused/Simplified for V2) */}
            {selectedArtwork && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedArtwork(null)}>
                    <div className="max-w-7xl w-full flex flex-col items-center">
                        <img
                            src={`https://ordinals.com/content/${selectedArtwork.inscription_id}`}
                            className="max-h-[70vh] object-contain shadow-2xl mb-8"
                        />
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white mb-2">{selectedArtwork.artwork_title}</h2>
                            <p className="text-white/50 font-mono text-xs uppercase tracking-widest mb-6">
                                {selectedArtwork.collection_name} • {selectedArtwork.year}
                            </p>
                            <a
                                href={`https://ordinals.com/inscription/${selectedArtwork.inscription_id}`}
                                target="_blank"
                                className="inline-block px-6 py-3 border border-white/20 hover:bg-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all"
                            >
                                View / Buy on Ordinals
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
