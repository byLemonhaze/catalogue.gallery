import { useState } from 'react'

type CatalogueFooterVariant = 'home' | 'info'

interface CatalogueFooterLinksProps {
    onOpenPolicy: () => void
    variant: CatalogueFooterVariant
    containerClassName?: string
}

const FOOTER_VARIANTS: Record<CatalogueFooterVariant, {
    desktopLinkClassName: string
    desktopButtonClassName: string
    mobileItemClassName: string
}> = {
    home: {
        desktopLinkClassName: 'inline-flex items-center justify-center text-white/45 hover:text-white transition-colors duration-300',
        desktopButtonClassName: 'cursor-pointer text-[10px] font-display text-white/35 hover:text-white transition-colors duration-300 uppercase tracking-[0.18em] mt-1',
        mobileItemClassName: 'cursor-pointer text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors duration-300',
    },
    info: {
        desktopLinkClassName: 'inline-flex items-center justify-center text-white/20 hover:text-white transition-colors duration-300',
        desktopButtonClassName: 'cursor-pointer text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest mt-1',
        mobileItemClassName: 'cursor-pointer text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors duration-300',
    },
}

export function CatalogueFooterLinks({
    onOpenPolicy,
    variant,
    containerClassName = '',
}: CatalogueFooterLinksProps) {
    const [showSocialMenu, setShowSocialMenu] = useState(false)
    const styles = FOOTER_VARIANTS[variant]

    const openPolicy = () => {
        onOpenPolicy()
        setShowSocialMenu(false)
    }

    return (
        <div className={containerClassName}>
            <div className="hidden md:flex flex-col items-end gap-1">
                <a
                    href="https://x.com/CatalogueART"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.desktopLinkClassName}
                    aria-label="Catalogue on X"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-70"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                </a>
                <button
                    onClick={openPolicy}
                    className={styles.desktopButtonClassName}
                >
                    Policy
                </button>
            </div>

            <div className="md:hidden relative">
                {showSocialMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSocialMenu(false)} />
                        <div className="absolute bottom-full right-0 mb-3 flex flex-col items-end gap-3 z-50 animate-fade-in">
                            <a
                                href="https://x.com/CatalogueART"
                                target="_blank"
                                rel="noreferrer"
                                className={styles.mobileItemClassName}
                            >
                                @CatalogueART
                            </a>
                            <button
                                onClick={openPolicy}
                                className={styles.mobileItemClassName}
                            >
                                Policy
                            </button>
                        </div>
                    </>
                )}
                <button
                    onClick={() => setShowSocialMenu((current) => !current)}
                    className={`text-[10px] font-bold transition-colors duration-300 uppercase tracking-widest p-2 -mr-2 relative z-50 ${
                        showSocialMenu ? 'text-white' : 'text-white/20 hover:text-white'
                    }`}
                    aria-label="Open social links"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-80"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                </button>
            </div>
        </div>
    )
}
