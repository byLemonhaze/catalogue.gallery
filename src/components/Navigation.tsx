import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HOME_SECTION_IDS, type HomeSectionKey } from '../constants/homeSections';

interface NavigationProps {
    onSearchOpen?: () => void;
    activeHomeSection?: HomeSectionKey;
}

const NAV_ITEMS: Array<{
    label: string;
    section: HomeSectionKey;
    legacyRoutes: string[];
}> = [
    { label: 'Directory', section: 'directory', legacyRoutes: ['/artists'] },
    { label: 'Content Lab', section: 'lab', legacyRoutes: ['/blog', '/content-lab'] },
    { label: 'Apply', section: 'apply', legacyRoutes: ['/info', '/submit'] },
];

export const Navigation: React.FC<NavigationProps> = ({ onSearchOpen, activeHomeSection }) => {
    const location = useLocation();
    const path = location.pathname;
    const isHome = path === '/';

    const isLegacySectionActive = (item: typeof NAV_ITEMS[number]) => {
        return item.legacyRoutes.some((route) => path.startsWith(route));
    };

    const scrollToHomeSection = (section: HomeSectionKey) => {
        const target = document.getElementById(HOME_SECTION_IDS[section]);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Hide navigation on artist pages
    if (path.startsWith('/artist/') || path.startsWith('/gallery/')) return null;

    const baseLinkClass =
        'inline-flex items-center pb-1 text-[11px] md:text-[12px] uppercase tracking-[0.12em] md:tracking-[0.16em] text-white/50 transition-colors duration-200 hover:text-white font-display cursor-pointer';
    const mobileLinkClass =
        'inline-flex items-center pb-1 text-[11px] uppercase tracking-[0.12em] text-white/50 transition-colors duration-200 hover:text-white font-display cursor-pointer';
    const activeLinkClass = 'text-white underline decoration-white underline-offset-4';
    const searchButtonClass = 'inline-flex items-center gap-2 pb-1 text-[11px] uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors duration-200 font-display border-l border-white/10 pl-5 ml-1 cursor-pointer';

    const renderBrand = (className: string) => {
        if (isHome) {
            return (
                <button
                    type="button"
                    onClick={() => scrollToHomeSection('hero')}
                    className={className}
                >
                    CATALOGUE
                </button>
            );
        }

        return (
            <Link to="/" className={className}>
                CATALOGUE
            </Link>
        );
    };

    const renderNavItem = (item: typeof NAV_ITEMS[number], className: string) => {
        const isSectionActive = isHome
            ? activeHomeSection === item.section
            : isLegacySectionActive(item);
        const resolvedClassName = `${className} ${isSectionActive ? activeLinkClass : ''}`;

        if (isHome) {
            return (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollToHomeSection(item.section)}
                    className={resolvedClassName}
                >
                    {item.label}
                </button>
            );
        }

        return (
            <Link
                key={item.label}
                to="/"
                state={{ homeSection: item.section }}
                className={resolvedClassName}
            >
                {item.label}
            </Link>
        );
    };

    return (
        <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
            {/* Mobile */}
            <div className="pointer-events-auto mt-4 border-y border-white/5 bg-black/65 px-4 pb-2 pt-3 backdrop-blur-md md:hidden">
                <div className="flex items-center justify-center relative">
                    {path !== '/' && (
                        <Link to="/" className="absolute left-6 text-white/30 hover:text-white transition-colors duration-200 flex items-center gap-1 text-[10px] tracking-widest uppercase font-display" aria-label="Back to home">
                            ←
                        </Link>
                    )}
                    {renderBrand('text-base uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80 font-display')}
                </div>
                <nav className="mt-3 flex items-center justify-center gap-4 overflow-x-auto px-2 scrollbar-hide">
                    {NAV_ITEMS.map((item) => renderNavItem(item, mobileLinkClass))}
                    {onSearchOpen && (
                        <button
                            type="button"
                            onClick={onSearchOpen}
                            className={mobileLinkClass}
                            aria-label="Search"
                        >
                            Search
                        </button>
                    )}
                </nav>
            </div>

            {/* Desktop */}
            <nav className="pointer-events-auto mx-auto mt-5 hidden w-[calc(100%-2rem)] max-w-7xl items-center justify-between gap-5 border border-white/10 bg-black/35 px-6 py-3 backdrop-blur-md md:flex">
                <div className="shrink-0 flex items-center gap-3">
                    {path !== '/' && (
                        <Link to="/" className="text-white/25 hover:text-white transition-colors duration-200 text-sm" aria-label="Back to home">
                            ←
                        </Link>
                    )}
                    {renderBrand('text-base md:text-lg uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80 font-display')}
                </div>

                <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide">
                    {NAV_ITEMS.map((item) => renderNavItem(item, baseLinkClass))}

                    {onSearchOpen && (
                        <button
                            type="button"
                            onClick={onSearchOpen}
                            className={searchButtonClass}
                            aria-label="Search"
                        >
                            <span className="text-sm">⌕</span>
                            <span>Search</span>
                            <kbd className="text-[9px] font-mono text-white/20 border border-white/10 px-1.5 py-0.5 leading-tight">⌘K</kbd>
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
};
