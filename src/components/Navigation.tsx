import { Link, useLocation } from 'react-router-dom';
import type { HomeSectionKey } from '../constants/homeSections';
export function Navigation({ onSearchOpen }: {
    onSearchOpen?: () => void;
    activeHomeSection?: HomeSectionKey;
}) {
    const location = useLocation();
    if (/^\/(artist|gallery)\/[^/]+\/world\/?$/.test(location.pathname))
        return null;
    return <header className="catalogue-masthead" data-home-nav="true"><a className="skip-link" href="#main-content">Skip to content</a><Link className="catalogue-wordmark" to="/">CATALOGUE<span>.gallery</span></Link><nav aria-label="Main navigation">{[['Directory', '/artists/'], ['Content Lab', '/blog/'], ['Dispatch', '/dispatch/'], ['Apply', '/submit/']].map(([label, to]) => <Link key={to} to={to} aria-current={location.pathname.startsWith(to.replace(/\/$/, '')) ? 'page' : undefined}>{label}</Link>)}<button onClick={onSearchOpen} aria-label="Search artists and stories">Search <kbd>⌘K</kbd></button></nav></header>;
}
