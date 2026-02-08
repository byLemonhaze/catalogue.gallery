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
    if (path.startsWith('/artist/')) return null;

    return (
        <header className="fixed top-6 inset-x-0 mx-auto w-fit max-w-[95vw] md:max-w-fit z-50 animate-fade-in-down">
            <nav className="flex items-center gap-1 md:gap-2 p-1.5 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-white/5 overflow-x-auto md:overflow-visible scrollbar-hide">
                {/* Logo Sector */}
                <div className="px-3 md:px-4 py-2 bg-white/5 rounded-full border border-white/5 shrink-0">
                    <Link to="/" className="text-xs font-black tracking-tighter text-white hover:opacity-80 transition-opacity cursor-pointer">
                        CATALOGUE
                    </Link>
                </div>

                {/* Links Sector */}
                <div className="flex items-center gap-1 px-1 shrink-0">
                    <Link
                        to="/artists"
                        className={`px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${isActive('/artists') ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        Directory
                    </Link>

                    <Link
                        to="/blog"
                        className={`px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${isActive('/blog') ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        Blog
                    </Link>

                    {/* Apply Link (Mission Statement) */}
                    <Link
                        to="/info"
                        className={`px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${isActive('/info') ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        APPLY
                    </Link>
                </div>
            </nav>
        </header>
    );
};
