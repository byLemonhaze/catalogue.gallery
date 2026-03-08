import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CatalogueFooterLinks } from './CatalogueFooterLinks';

interface InfoHubProps {
    setIsLegalModalOpen: (open: boolean) => void;
}

export function InfoHub({ setIsLegalModalOpen }: InfoHubProps) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet>
                <title>Apply | CATALOGUE</title>
            </Helmet>

            <div className="pt-28 md:pt-24 p-6 max-w-5xl mx-auto min-h-screen animate-fade-in relative pb-32">

                {/* Content */}
                <div className="mt-0 divide-y divide-white/10">

                    <section className="pt-0 pb-10 md:py-14 space-y-4">
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
                <CatalogueFooterLinks
                    onOpenPolicy={() => setIsLegalModalOpen(true)}
                    variant="info"
                    containerClassName="fixed bottom-20 md:bottom-8 right-6 z-50 flex flex-col items-end gap-1"
                />
            </div>
        </div>
    );
}
