import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { urlFor } from '../sanity/image';
import { Seo } from '../components/Seo';
import { missingMeta, profileMeta } from '../lib/seo';
import { useArtists } from '../hooks/useArtists';
import { readProfileBootstrap, externalOnlyProfiles } from '../lib/profileBootstrap';
import { SquareLoader } from '../components/SquareLoader';

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
    const location = useLocation();
    return <ArtistUniverse key={`${location.pathname.startsWith('/gallery/') ? 'gallery' : 'artist'}:${id}`} id={id} />;
}
type ExitHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;

function useArtistExit(): ExitHandler {
    const navigate = useNavigate();
    const location = useLocation();
    return event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const state = location.state as { from?: string } | null;
        if (state?.from === 'profile') { event.preventDefault(); navigate(-1); }

    };
}

function ProfileLookupState({ loading, error, onExit }: { loading: boolean; error: string | null; onExit: ExitHandler }) {
    return <div className="world-shell world-state">
        <div className="world-message"><span className="world-brand">CATALOGUE<span>.gallery</span></span>
            {loading ? <>
                <SquareLoader className="h-6 w-6" label="Finding artist" />
                <p className="world-message-copy">Finding this artist’s world…</p>
            </> : <>
                <h1 className="world-message-title">{error ? 'The directory could not load.' : 'This profile is not available.'}</h1>
                <p className="world-message-copy">{error ? 'Check your connection and try again.' : 'The artist may have moved, or this link is out of date.'}</p>
                {error && <button className="world-text-link" onClick={() => window.location.reload()}>Try again</button>}
            </>}
            <Link to="/" onClick={onExit} className="world-text-link">Return to CATALOGUE</Link>
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

function UnavailableWebsite({ name, website }: { name: string; website: string }) {
    return <div className="world-state">
        <div className="world-message">
            <p className="world-artist-label">{name}</p>
            <h1 className="world-message-title">{website ? 'This website cannot be displayed here.' : 'A new address is on its way.'}</h1>
            <p className="world-message-copy">{website ? 'This artist’s website currently prevents viewing inside CATALOGUE. Open their website directly to explore the work.' : 'This profile does not currently have a valid website address.'}</p>
            {website && <a href={website} target="_blank" rel="noopener noreferrer" className="world-action">Open official website</a>}
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
        <iframe src={website} className="world-iframe" onLoad={() => setFrameLoaded(true)} title={`${name} Website`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-pointer-lock"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
        {!frameLoaded && <div role="status" className="world-loading">
            {!slow && <SquareLoader className="w-3 h-3 shrink-0" label="Opening website" />}
            <span><span className="world-loading-brand">CATALOGUE</span>{slow ? 'This website is taking a little longer to load.' : `Opening ${name}…`}</span>
        </div>}
    </>;
}

function ArtistUniverse({ id }: { id: string }) {
    const location = useLocation();
    const route = location.pathname.startsWith('/gallery/') ? 'gallery' : 'artist';
    const [bootstrap] = useState(() => readProfileBootstrap(id, route));
    const { artists, loading, error } = useArtists();
    const artist = artists.find(item => item.id === id && (item.type || 'artist') === route) || ((loading || error) ? bootstrap : null);
    const handleExit = useArtistExit();
    const exitLink = useRef<HTMLAnchorElement>(null);
    useEffect(() => { if (artist) exitLink.current?.focus(); }, [artist]);
    if (!artist) return <>{!loading && !error && <Seo meta={missingMeta(location.pathname)} />}<ProfileLookupState loading={loading} error={error} onExit={handleExit} /></>;

    const website = resolveWebsiteUrl(artist.websiteUrl);
    const canEmbed = website && !externalOnlyProfiles.has(id) && !website.startsWith('http:');
    return <div className="world-shell">
        <Seo meta={{...profileMeta({ ...artist, type: route, image: bootstrap?.seoImageUrl || (typeof artist.thumbnail === 'string' ? artist.thumbnail : artist.thumbnail ? urlFor(artist.thumbnail).url() : undefined) }), noindex: true}} />
        <nav aria-label="Artist website controls" data-mobile-position={artist.mobileExitPosition || 'bottom-center'} className={`world-controls fixed z-[120] flex flex-wrap justify-center gap-2 max-w-[calc(100%-2rem)] ${getPositionClasses(artist.desktopExitPosition || 'top-right', artist.mobileExitPosition || 'bottom-center')}`}>
            <Link ref={exitLink} to={`/${route}/${encodeURIComponent(id)}/`} onClick={handleExit} aria-label="Exit Artist Universe" className="world-exit"><span className="world-exit-brand">CATALOGUE</span><span className="world-exit-label">Exit world <span className="world-close-mark" aria-hidden="true"/></span></Link>
        </nav>
        {canEmbed ? <EmbeddedWebsite key={website} website={website} name={artist.name} /> : <UnavailableWebsite name={artist.name} website={website} />}
    </div>;
}
