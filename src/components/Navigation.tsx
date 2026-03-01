import React from 'react';
import { Link, useLocation } from 'react-router-dom';


export const Navigation: React.FC = () => {
    const location = useLocation();
    const path = location.pathname;


    const isActive = (route: string) => {
        if (route === '/' && path === '/') return true;
        if (route === '/info' && (path === '/info' || path === '/submit')) return true;
        if (route !== '/' && route !== '/info' && path.startsWith(route)) return true;
        return false;
    };

    // Hide navigation on artist pages
    if (path.startsWith('/artist/') || path.startsWith('/gallery/')) return null;

    const baseLinkClass =
        'inline-flex items-center pb-1 text-[11px] md:text-[12px] uppercase tracking-[0.12em] md:tracking-[0.16em] text-white/50 transition-colors duration-200 hover:text-white font-display';
    const mobileLinkClass =
        'inline-flex items-center pb-1 text-[11px] uppercase tracking-[0.12em] text-white/50 transition-colors duration-200 hover:text-white font-display';
    const activeLinkClass = 'text-white underline decoration-white underline-offset-4';

    return (
        <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
            <div className="md:hidden pointer-events-auto mt-4">
                <div className="flex items-center justify-center">
                    <Link to="/" className="text-base uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80 font-display">
                        CATALOGUE
                    </Link>
                </div>
                <nav className="mt-2 flex items-center justify-center gap-6">
                    <Link
                        to="/artists"
                        className={`${mobileLinkClass} ${isActive('/artists') ? activeLinkClass : ''}`}
                    >
                        Directory
                    </Link>

                    <Link
                        to="/blog"
                        className={`${mobileLinkClass} ${isActive('/blog') ? activeLinkClass : ''}`}
                    >
                        Blog
                    </Link>

                    <Link
                        to="/info"
                        className={`${mobileLinkClass} ${isActive('/info') ? activeLinkClass : ''}`}
                    >
                        Apply
                    </Link>
                </nav>
            </div>

            <nav className="pointer-events-auto mx-auto mt-6 hidden w-full max-w-7xl items-center justify-between gap-5 px-8 md:flex">
                <div className="shrink-0">
                    <Link to="/" className="text-base md:text-lg uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80 font-display">
                        CATALOGUE
                    </Link>
                </div>

                <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide">
                    <Link
                        to="/artists"
                        className={`${baseLinkClass} ${isActive('/artists') ? activeLinkClass : ''}`}
                    >
                        Directory
                    </Link>

                    <Link
                        to="/blog"
                        className={`${baseLinkClass} ${isActive('/blog') ? activeLinkClass : ''}`}
                    >
                        Blog
                    </Link>

                    <Link
                        to="/info"
                        className={`${baseLinkClass} ${isActive('/info') ? activeLinkClass : ''}`}
                    >
                        Apply
                    </Link>
                </div>
            </nav>
        </header>
    );
};
