interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LegalModal({ isOpen, onClose }: LegalModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-in">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">LEGAL FRAMEWORK</h2>
                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">Last Updated: Jan 30, 2026</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                        aria-label="Close modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">

                    {/* Terms */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 pb-2 border-b border-white/5">01. Terms of Service</h3>
                        <div className="space-y-4 text-[11px] text-white/50 leading-relaxed font-mono">
                            <p>By access or use of CATALOGUE, you agree to these terms.</p>
                            <div className="space-y-2">
                                <span className="text-white uppercase font-bold tracking-widest text-[9px]">The Universe / Iframes</span>
                                <p>Content within "Universes" is owned solely by the artists. CATALOGUE is a directory and assumes no responsibility for third-party content or privacy practices.</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-white uppercase font-bold tracking-widest text-[9px]">Curation</span>
                                <p>CATALOGUE reserves the right to approve, reject, or remove any listing at its sole discretion. No malicious or deceptive content is permitted.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 pb-2 border-b border-white/5">02. Privacy & Cookies</h3>
                        <div className="space-y-4 text-[11px] text-white/50 leading-relaxed font-mono">
                            <p>We collect artist/gallery names, URLs, and a required contact email via the application form. If approved, your artist/gallery name and URL are made public. Email addresses are never publicly displayed.</p>
                            <div className="space-y-2">
                                <span className="text-white uppercase font-bold tracking-widest text-[9px]">Email Usage</span>
                                <p>We use your email solely to communicate about your submission status and send occasional platform updates. We will never sell, trade, or share your email with third parties.</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-white uppercase font-bold tracking-widest text-[9px]">Zero-Tracking Policy</span>
                                <p>No marketing or tracking cookies are used. We do not use Google Analytics or Meta Pixels. Only essential technical cookies for security (Cloudflare) are used.</p>
                            </div>
                        </div>
                    </section>

                    {/* DMCA */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 pb-2 border-b border-white/5">03. DMCA & Copyright</h3>
                        <div className="space-y-4 text-[11px] text-white/50 leading-relaxed font-mono">
                            <p>If you believe your copyright is violated (e.g. an unauthorized thumbnail), please notify us with the work ID and your contact info.</p>
                        </div>
                    </section>
                </div>

                {/* Footer Tip */}
                <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center px-8">
                    <p className="text-[9px] text-white/20 font-mono tracking-widest uppercase">CATALOGUE — FOR COLLECTORS, FROM THE LENS OF THE ARTISTS</p>
                </div>
            </div>
        </div>
    );
}
