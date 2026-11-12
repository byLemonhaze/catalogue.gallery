import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { HomeSectionKey } from '../constants/homeSections';
export function Navigation({ onSearchOpen }: {
    onSearchOpen?: () => void;
    activeHomeSection?: HomeSectionKey;
}) {
    const location = useLocation();
    const [signatureLoaded, setSignatureLoaded] = useState(false);
    // SSR images may finish loading before hydration attaches onLoad.
    const signatureRef = useCallback((image: HTMLImageElement | null) => {
        if (image) setSignatureLoaded(image.complete && image.naturalWidth > 0);
    }, []);
    if (/^\/(artist|gallery)\/[^/]+\/world\/?$/.test(location.pathname))
        return null;
    return <header className="catalogue-masthead" data-home-nav="true"><a className="skip-link" href="#main-content">Skip to content</a><Link className="catalogue-wordmark" to="/">CATALOGUE<span className="catalogue-signature" data-loaded={signatureLoaded}><span className="catalogue-signature-fallback">.gallery</span><img ref={signatureRef} src="/gallery-signature.svg" alt="" aria-hidden="true" onLoad={() => setSignatureLoaded(true)} onError={() => setSignatureLoaded(false)} /></span></Link><nav aria-label="Main navigation">{[['Directory', '/artists/'], ['Content Lab', '/blog/'], ['Dispatch', '/dispatch/'], ['Apply', '/submit/']].map(([label, to]) => <Link key={to} to={to} aria-current={location.pathname.startsWith(to.replace(/\/$/, '')) ? 'page' : undefined}>{label}</Link>)}<button onClick={onSearchOpen} aria-label="Search artists and stories">Search <kbd>⌘K</kbd></button></nav></header>;
}
