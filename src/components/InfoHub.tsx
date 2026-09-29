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
                <title>About | CATALOGUE</title>
            </Helmet>

            <div className="pt-28 md:pt-24 p-6 max-w-5xl mx-auto min-h-screen animate-fade-in relative pb-32">

                {/* Content */}
                <div className="mt-0 divide-y divide-white/20">

                    <section className="pt-0 pb-10 md:py-14 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7c7c7]">About</p>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">CATALOGUE</h2>
                        <p className="text-[#d1d1d1] text-base leading-7 max-w-2xl">
                            An independent publication and directory for digital art. Read the stories, meet the artists, and explore the work through their own websites. Across mediums, platforms, and chains.
                        </p>
                    </section>

                    <section className="py-10 md:py-12 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7c7c7]">For Collectors</p>
                        <p className="text-[#d1d1d1] text-base leading-7 max-w-2xl">
                            Follow a story into an artist’s practice. Find new work, return to familiar voices, and build your own understanding of digital art.
                        </p>
                    </section>

                    <section className="py-10 md:py-12 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7c7c7]">For Artists</p>
                        <p className="text-[#d1d1d1] text-base leading-7 max-w-2xl">
                            Your website is your space. CATALOGUE helps readers and collectors find it, with your work presented on your terms.
                        </p>
                    </section>

                    <section className="py-10 md:py-12 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7c7c7]">For Galleries</p>
                        <p className="text-[#d1d1d1] text-base leading-7 max-w-2xl">
                            Share the artists and ideas behind your programme. Our directory brings independent galleries and curated spaces into the same conversation as the practices they support.
                        </p>
                    </section>

                    <section className="py-10 md:py-14 space-y-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7c7c7]">Apply</p>
                        <p className="text-[#d1d1d1] text-base leading-7">
                            Submit your artist or gallery profile for review.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/submit"
                                className="inline-flex min-h-12 items-center justify-center px-6 py-3 bg-[#f2f2ef] hover:bg-white !text-[#111111] border border-[#f2f2ef] text-xs font-bold uppercase tracking-[0.14em] transition-colors"
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
