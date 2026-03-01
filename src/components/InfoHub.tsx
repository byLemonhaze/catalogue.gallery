import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

interface InfoHubProps {
    setIsLegalModalOpen: (open: boolean) => void;
}

export function InfoHub({ setIsLegalModalOpen }: InfoHubProps) {
    const [showSocialMenu, setShowSocialMenu] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet>
                <title>Apply | CATALOGUE</title>
            </Helmet>

            <div className="pt-28 md:pt-24 p-6 max-w-5xl mx-auto min-h-screen animate-fade-in relative pb-32">

                {/* Content */}
                <div className="mt-12 divide-y divide-white/10">

                    <section className="py-10 md:py-14 space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">About</p>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">CATALOGUE</h2>
                        <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl">
                            A directory of digital artists linking directly to their personal websites, alongside curated galleries, interviews, and art-focused content. Chain and marketplace agnostic, for collectors from the lens of artists.
                        </p>
                    </section>

                    <section className="py-10 md:py-12 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">For Collectors</p>
                        <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl">
                            Showcase your art collection and explore the unique universes of your favorite artists through their own websites: unfiltered, self-curated, and independent.
                        </p>
                    </section>

                    <section className="py-10 md:py-12 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">For Artists</p>
                        <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl">
                            CATALOGUE is built around artist-owned universes, connecting collectors directly to your own website where authorship, context, and independence remain fully under your control.
                        </p>
                    </section>

                    <section className="py-10 md:py-12 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">For Galleries</p>
                        <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl">
                            CATALOGUE features curated spaces for galleries and platforms, presenting cohesive curatorial visions and collective practices. These listings represent distinct art-focused environments, separate from individual artist profiles and personal domains.
                        </p>
                    </section>

                    <section className="py-10 md:py-14 space-y-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Apply</p>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Submit your artist or gallery profile for review.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/submit"
                                className="inline-flex items-center justify-center px-6 py-3 bg-transparent hover:bg-white/5 text-white border border-white/25 hover:border-white/40 text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                Apply to Catalogue
                            </Link>
                        </div>
                    </section>
                </div>

                {/* Footer Overhaul */}
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-1">
                    {/* Desktop: Stacked Links */}
                    <div className="hidden md:flex flex-col items-end gap-1">
                        <a
                            href="https://x.com/CatalogueART"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest"
                        >
                            @CATALOGUEART - X
                        </a>
                        <button
                            onClick={() => setIsLegalModalOpen(true)}
                            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest mt-1"
                        >
                            Catalogue Policy
                        </button>
                    </div>

                    {/* Mobile: Toggle Menu */}
                    <div className="md:hidden relative">
                        {showSocialMenu && (
                            <>
                                {/* Backdrop to close */}
                                <div
                                    className="fixed inset-0 z-40 bg-black/70"
                                    onClick={() => setShowSocialMenu(false)}
                                />

                                {/* Menu */}
                                <div className="absolute bottom-full right-0 mb-4 flex flex-col items-end gap-4 bg-[#0d0d0d] p-6 border border-white/10 shadow-2xl min-w-[140px] z-50 animate-fade-in origin-bottom-right">
                                    <a
                                        href="https://x.com/CatalogueART"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-widest flex items-center gap-2"
                                    >
                                        Twitter ↗
                                    </a>
                                    <div className="w-full h-px bg-white/10" />
                                    <button
                                        onClick={() => {
                                            setIsLegalModalOpen(true);
                                            setShowSocialMenu(false);
                                        }}
                                        className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-widest flex items-center gap-2 text-right"
                                    >
                                        Policy ↗
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => setShowSocialMenu(!showSocialMenu)}
                            className={`text-[10px] font-bold transition-colors duration-300 uppercase tracking-widest p-2 -mr-2 relative z-50 ${showSocialMenu ? 'text-white' : 'text-white/20 hover:text-white'}`}
                        >
                            @
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
