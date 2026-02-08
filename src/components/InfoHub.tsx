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

            <div className="pt-32 md:pt-28 p-6 max-w-4xl mx-auto min-h-screen animate-fade-in relative pb-32">

                {/* Content */}
                <div className="space-y-8 md:space-y-10 mt-8 text-center">

                    {/* Intro */}
                    <section className="space-y-3 flex flex-col items-center">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">CATALOGUE</h2>
                        <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                            CATALOGUE is a directory of digital artists linking directly to their personal websites, alongside curated galleries, interviews, and art-focused content. Chain & marketplace agnostic - for collectors, from the lens of the artists.
                        </p>
                    </section>

                    {/* For Collectors */}
                    <section className="space-y-4 flex flex-col items-center">
                        <h3 className="text-white font-bold text-base">For Collectors</h3>
                        <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-3xl md:max-w-4xl mx-auto">
                            Showcase your art collection and explore the unique universes of your favorite artists through their own websites - unfiltered, self-curated, and independent.
                        </p>
                    </section>

                    {/* For Artists */}
                    <section className="space-y-6 flex flex-col items-center">
                        <div className="space-y-4 max-w-3xl md:max-w-4xl mx-auto">
                            <h3 className="text-white font-bold text-base">For Artists</h3>
                            <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                                CATALOGUE is built around artist-owned universes, connecting collectors directly to your own website — where authorship, context, and independence remain fully under your control.
                            </p>
                        </div>
                    </section>

                    {/* For Galleries */}
                    <section className="space-y-6 flex flex-col items-center">
                        <div className="space-y-4 max-w-3xl md:max-w-4xl mx-auto">
                            <h3 className="text-white font-bold text-base">For Galleries</h3>
                            <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                                CATALOGUE features curated spaces for galleries and platforms, presenting cohesive curatorial visions and collective practices. These listings represent distinct art-focused environments, separate from individual artist profiles and personal domains.
                            </p>
                        </div>
                    </section>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/submit"
                            className="inline-block px-8 py-3 bg-white hover:bg-neutral-200 text-black border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
                        >
                            Apply to Catalogue
                        </Link>
                        <Link
                            to="/build"
                            className="inline-block px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
                        >
                            Build Universe
                        </Link>
                    </div>
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
                        <a
                            href="https://discord.gg/QHWnyNNB"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest"
                        >
                            @CATALOGUE - DISCORD
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
                                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setShowSocialMenu(false)}
                                />

                                {/* Menu */}
                                <div className="absolute bottom-full right-0 mb-4 flex flex-col items-end gap-4 bg-[#111] p-6 rounded-xl border border-white/10 shadow-2xl min-w-[140px] z-50 animate-fade-in origin-bottom-right">
                                    <a
                                        href="https://x.com/CatalogueART"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-white hover:text-purple-400 uppercase tracking-widest flex items-center gap-2"
                                    >
                                        Twitter ↗
                                    </a>
                                    <div className="w-full h-px bg-white/10" />
                                    <a
                                        href="https://discord.gg/QHWnyNNB"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-white hover:text-purple-400 uppercase tracking-widest flex items-center gap-2"
                                    >
                                        Discord ↗
                                    </a>
                                    <div className="w-full h-px bg-white/10" />
                                    <button
                                        onClick={() => {
                                            setIsLegalModalOpen(true);
                                            setShowSocialMenu(false);
                                        }}
                                        className="text-xs font-bold text-white hover:text-purple-400 uppercase tracking-widest flex items-center gap-2 text-right"
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
