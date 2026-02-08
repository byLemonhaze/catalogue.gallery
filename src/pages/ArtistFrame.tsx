import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useArtists } from '../hooks/useArtists';

// Helper to resolve positioning classes
const getPositionClasses = (desktop: string, mobile: string) => {
    let classes = '';

    // Mobile
    switch (mobile) {
        case 'bottom-center': classes += 'bottom-12 left-1/2 -translate-x-1/2 '; break;
        case 'top-center': classes += 'top-8 left-1/2 -translate-x-1/2 '; break;
        case 'top-right': classes += 'top-8 right-6 '; break;
        case 'top-left': classes += 'top-8 left-6 '; break;
        default: classes += 'bottom-12 left-1/2 -translate-x-1/2 '; // Default
    }

    // Desktop (Overriding mobile with md:)
    switch (desktop) {
        case 'top-right': classes += 'md:bottom-auto md:left-auto md:top-8 md:right-8 md:translate-x-0'; break;
        case 'top-left': classes += 'md:bottom-auto md:right-auto md:top-8 md:left-8 md:translate-x-0'; break;
        case 'top-center': classes += 'md:bottom-auto md:right-auto md:left-1/2 md:top-8 md:-translate-x-1/2'; break;
        case 'bottom-right': classes += 'md:top-auto md:left-auto md:bottom-8 md:right-8 md:translate-x-0'; break;
        case 'bottom-left': classes += 'md:top-auto md:right-auto md:bottom-8 md:left-8 md:translate-x-0'; break;
        default: classes += 'md:bottom-auto md:left-auto md:top-8 md:right-8 md:translate-x-0'; // Default
    }

    return classes;
};

// Helper for hidden transform (slide direction)
const getHiddenTransform = (desktop: string, mobile: string) => {
    // Simplified: Always scale down to 95%.
    // Direction should be "away" from the screen center.

    // Mobile hidden state
    let mobileTrans = '';
    if (mobile.includes('bottom')) mobileTrans = 'translate-y-4';
    else if (mobile.includes('top')) mobileTrans = '-translate-y-4';

    // Desktop hidden state
    let desktopTrans = '';
    if (desktop.includes('top')) desktopTrans = 'md:-translate-y-4 md:translate-x-0'; // Slide UP
    else if (desktop.includes('bottom')) desktopTrans = 'md:translate-y-4 md:translate-x-0'; // Slide DOWN

    return `${mobileTrans} ${desktopTrans} scale-95`;
};

export function ArtistFrame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { artists, loading } = useArtists();
    const [isLoading, setIsLoading] = useState(true);

    const artist = artists.find(a => a.id === id);

    // Redirect or show error if artist not found
    useEffect(() => {
        if (!loading && !artist) {
            // Optional: navigate('/') or show error
        }
    }, [artist, loading, navigate]);

    // Exit Handler
    const handleExit = (e: React.MouseEvent) => {
        const state = location.state as { from?: string; slideIndex?: number } | null;

        // If from Home, go back with slide index state
        if (state?.from === 'home' && typeof state.slideIndex === 'number') {
            e.preventDefault();
            navigate('/', { state: { returnFromUniverse: true, slideIndex: state.slideIndex } });
            return;
        }

        // If from Directory, go back (preserves scroll)
        if (state?.from === 'directory') {
            e.preventDefault();
            navigate(-1);
            return;
        }

        // Default: Just let Link to="/" happen (or force it if needed)
    };

    const [showControls, setShowControls] = useState(true);
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleInput = () => {
        setShowControls(true);
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setShowControls(false), 2500);
    };

    useEffect(() => {
        // Initial timer
        hideTimer = setTimeout(() => setShowControls(false), 2500);

        window.addEventListener('mousemove', handleInput);
        window.addEventListener('touchstart', handleInput);
        window.addEventListener('keydown', handleInput);

        return () => {
            if (hideTimer) clearTimeout(hideTimer);
            window.removeEventListener('mousemove', handleInput);
            window.removeEventListener('touchstart', handleInput);
            window.removeEventListener('keydown', handleInput);
        };
    }, []);

    if (!artist) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <Helmet>
                <title>{artist.name} | CATALOGUE</title>
            </Helmet>

            {/* Sensor Frame - Thin edges to catch mouse without blocking too much content */}
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 h-6 z-[200]" onMouseEnter={handleInput} />
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-6 z-[200]" onMouseEnter={handleInput} />
            {/* Left */}
            <div className="absolute top-0 bottom-0 left-0 w-6 z-[200]" onMouseEnter={handleInput} />
            {/* Right */}
            <div className="absolute top-0 bottom-0 right-0 w-6 z-[200]" onMouseEnter={handleInput} />

            {/* Exit Navigation Overlay */}
            <div
                className={`fixed z-[101] pointer-events-none transition-all duration-500 ease-in-out 
                ${showControls ? 'opacity-100' : 'opacity-50 md:opacity-25'} 
                ${getPositionClasses(artist.desktopExitPosition || 'top-right', artist.mobileExitPosition || 'bottom-center')}`}
            >
                <div className={`pointer-events-auto transition-all duration-500 
                    ${showControls ? 'translate-y-0 translate-x-0 scale-100' : getHiddenTransform(artist.desktopExitPosition || 'top-right', artist.mobileExitPosition || 'bottom-center')}`}
                >
                    <Link
                        to="/"
                        onClick={handleExit}
                        title="Exit Application"
                        aria-label="Exit Artist Universe"
                        className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white border border-white/5 hover:border-white/20 transition-all flex items-center gap-2 group hover:bg-black/90 shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:scale-105"
                    >
                        <span>Exit ✕</span>
                    </Link>
                </div>
            </div>

            {/* Loading Indicator */}
            {(isLoading || loading) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Loading Universe...</p>
                    </div>
                </div>
            )}

            {/* The Iframe */}
            <iframe
                src={artist.websiteUrl}
                className="w-full h-full border-0 bg-transparent relative z-0"
                onLoad={() => setIsLoading(false)}
                title={`${artist.name} Website`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-pointer-lock"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        </div>
    );
}
