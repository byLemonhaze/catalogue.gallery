import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useArtists } from '../hooks/useArtists';
import { readProfileBootstrap, externalOnlyProfiles } from '../lib/profileBootstrap';
import { SquareLoader } from '../components/SquareLoader';
import { buildHomeNavigationState } from '../lib/homeMemory';

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

export function ArtistFrame() {
    const { id = '' } = useParams<{ id: string }>();
    return <ArtistUniverse key={id} id={id} />;
}
type ExitHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;

function useArtistExit(): ExitHandler {
    const navigate = useNavigate();
    const location = useLocation();
    return event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const state = location.state as { from?: string; slideIndex?: number; homeSection?: 'directory'; homeScrollTop?: number; directoryPage?: number } | null;
        if (state?.from === 'home' && typeof state.slideIndex === 'number') {
            event.preventDefault();
            navigate('/', { state: { returnFromUniverse: true, slideIndex: state.slideIndex } });
            return;
        }
        if (state?.from === 'directory-section') {
            event.preventDefault();
            navigate('/', { state: { homeSection: 'directory', homeScrollTop: state.homeScrollTop, directoryPage: state.directoryPage } });
            return;
        }
        if (state?.from === 'directory') {
            event.preventDefault();
            navigate(-1);
            return;
        }
        const home = buildHomeNavigationState();
        if (home) {
            event.preventDefault();
            navigate('/', { state: home });
        }
    };
}

function ProfileLookupState({ loading, error, onExit }: { loading: boolean; error: string | null; onExit: ExitHandler }) {
    return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center px-6">
        <div className="text-center max-w-md">
            {loading ? <>
                <SquareLoader className="h-6 w-6 mx-auto" label="Finding artist" />
                <p className="mt-5 text-white/60">Finding this artist’s world…</p>
            </> : <>
                <h1 className="text-2xl">{error ? 'The directory could not load.' : 'This profile is not available.'}</h1>
                <p className="text-white/60 mt-4">{error ? 'Check your connection and try again.' : 'The artist may have moved, or this link is out of date.'}</p>
                {error && <button className="editorial-link mt-4" onClick={() => window.location.reload()}>Try again</button>}
            </>}
            <Link to="/" onClick={onExit} className="editorial-link mt-6">Return to CATALOGUE</Link>
        </div>
    </div>;
}

function resolveWebsiteUrl(value: string) {
    try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function UnavailableWebsite({ name, hasWebsite }: { name: string; hasWebsite: boolean }) {
    return <div className="h-full flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
            <p className="editorial-kicker">{name}</p>
            <h1 className="text-3xl md:text-4xl mt-5 mb-6">{hasWebsite ? 'This website cannot be displayed here.' : 'A new address is on its way.'}</h1>
            <p className="text-sm leading-relaxed text-white/60">{hasWebsite ? 'This artist’s website currently prevents viewing inside CATALOGUE. Exit to continue exploring the directory.' : 'This profile does not currently have a valid website address.'}</p>
        </div>
    </div>;
}

function EmbeddedWebsite({ website, name }: { website: string; name: string }) {
    const [frameLoaded, setFrameLoaded] = useState(false);
    const [slow, setSlow] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => setSlow(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    return <>
        <iframe src={website} className="w-full h-full border-0 bg-black" onLoad={() => setFrameLoaded(true)} title={`${name} Website`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-pointer-lock"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
        {!frameLoaded && <div role="status" className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 max-w-[80vw] bg-black/90 border border-white/15 px-4 py-2 text-[11px] text-white/70 flex items-center gap-3">
            {!slow && <SquareLoader className="w-3 h-3 shrink-0" label="Opening website" />}
            <span>{slow ? 'This website is taking a little longer to load.' : `Opening ${name}…`}</span>
        </div>}
    </>;
}

function ArtistUniverse({ id }: { id: string }) {
    const location = useLocation();
    const route = location.pathname.startsWith('/gallery/') ? 'gallery' : 'artist';
    const [bootstrap] = useState(() => readProfileBootstrap(id, route));
    const { artists, loading, error } = useArtists();
    const artist = artists.find(item => item.id === id) || ((loading || error) ? bootstrap : null);
    const handleExit = useArtistExit();
    if (!artist) return <ProfileLookupState loading={loading} error={error} onExit={handleExit} />;

    const website = resolveWebsiteUrl(artist.websiteUrl);
    const canEmbed = website && !externalOnlyProfiles.has(id) && !website.startsWith('http:');
    return <div className="fixed inset-0 z-[100] bg-black">
        <Helmet><title>{artist.name} | CATALOGUE</title></Helmet>
        <nav aria-label="Artist website controls" className={`fixed z-[120] flex flex-wrap justify-center gap-2 max-w-[calc(100%-2rem)] ${getPositionClasses(artist.desktopExitPosition || 'top-right', artist.mobileExitPosition || 'bottom-center')}`}>
            <Link to="/" onClick={handleExit} aria-label="Exit Artist Universe" className="min-h-11 px-4 py-3 bg-[#101010] border border-white/25 text-[10px] font-semibold tracking-wider uppercase text-white flex items-center justify-center">Exit ✕</Link>
        </nav>
        {canEmbed ? <EmbeddedWebsite key={website} website={website} name={artist.name} /> : <UnavailableWebsite name={artist.name} hasWebsite={Boolean(website)} />}
    </div>;
}
