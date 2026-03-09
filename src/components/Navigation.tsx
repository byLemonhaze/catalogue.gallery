import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HOME_SECTION_IDS, type HomeSectionKey } from '../constants/homeSections';
import { buildHomeNavigationState } from '../lib/homeMemory';

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
    const homeReturnState = buildHomeNavigationState();

    const getVisibleHomeNavBottom = () => {
        const navCandidates = Array.from(document.querySelectorAll<HTMLElement>('[data-home-nav="true"]'));
        const visibleNav = navCandidates.find((element) => element.offsetParent !== null);
        return visibleNav?.getBoundingClientRect().bottom ?? 0;
    };

    const isLegacySectionActive = (item: typeof NAV_ITEMS[number]) => {
        return item.legacyRoutes.some((route) => path.startsWith(route));
    };

    const scrollToHomeSection = (section: HomeSectionKey) => {
        const container = document.getElementById('home-scroll-container') as HTMLDivElement | null;
        const sectionElement = document.getElementById(HOME_SECTION_IDS[section]);
        const target = sectionElement?.querySelector<HTMLElement>('[data-home-scroll-anchor="true"]') || sectionElement;
        if (!container || !target) return;
        const targetRect = target.getBoundingClientRect();
        const desiredTop = getVisibleHomeNavBottom() + 18;
        container.scrollTo({
            top: Math.max(0, container.scrollTop + targetRect.top - desiredTop),
            behavior: 'smooth',
        });
    };

    // Hide navigation on artist pages
    if (path.startsWith('/artist/') || path.startsWith('/gallery/')) return null;

    const baseLinkClass =
        'inline-flex items-center pb-1 text-[11px] md:text-[12px] uppercase tracking-[0.12em] md:tracking-[0.16em] text-white/50 transition-colors duration-200 hover:text-white font-display cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0';
    const mobileLinkClass =
        'inline-flex items-center pb-1 text-[11px] uppercase tracking-[0.12em] text-white/50 transition-colors duration-200 hover:text-white font-display cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0';
    const activeLinkClass = 'text-white underline decoration-white underline-offset-4';
    const searchButtonClass = 'inline-flex items-center gap-2 pb-1 text-[11px] uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors duration-200 font-display border-l border-white/10 pl-5 ml-1 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0';
    const backLinkClass = 'text-white/25 hover:text-white transition-colors duration-200 text-sm';

    const renderBrand = (className: string) => {
        if (isHome) {
            return (
                <button
                    type="button"
                    onClick={(event) => {
                        event.currentTarget.blur();
                        scrollToHomeSection('hero');
                    }}
                    className={className}
                >
                    CATALOGUE
                </button>
            );
        }

        return (
            <Link to="/" state={homeReturnState} className={className}>
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
                    onClick={(event) => {
                        event.currentTarget.blur();
                        scrollToHomeSection(item.section);
                    }}
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
            <div data-home-nav="true" className="pointer-events-auto mt-4 border-y border-white/5 bg-black/65 px-4 pb-2 pt-3 backdrop-blur-md md:hidden">
                <div className="flex items-center justify-center relative">
                    <div className="absolute left-4 inline-flex w-6 justify-center">
                        {path !== '/' && (
                            <Link
                                to="/"
                                state={homeReturnState}
                                className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-white/30 transition-colors duration-200 hover:text-white font-display"
                                aria-label="Back to home"
                            >
                                ←
                            </Link>
                        )}
                    </div>
                    {renderBrand('cursor-pointer text-base uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80 font-display outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0')}
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
            <nav data-home-nav="true" className="pointer-events-auto mx-auto mt-5 hidden w-[calc(100%-2rem)] max-w-7xl items-center justify-between gap-5 border border-white/10 bg-black/35 px-6 py-3 backdrop-blur-md md:flex">
                <div className="grid shrink-0 grid-cols-[1rem_auto] items-center gap-3">
                    <div className="inline-flex w-4 justify-center">
                        {path !== '/' && (
                            <Link to="/" state={homeReturnState} className={backLinkClass} aria-label="Back to home">
                                ←
                            </Link>
                        )}
                    </div>
                    {renderBrand('cursor-pointer text-base md:text-lg uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80 font-display outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0')}
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
