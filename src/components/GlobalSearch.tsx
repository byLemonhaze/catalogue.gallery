import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';
import { profileImage } from '../lib/profilePresentation';
import { ProfileLink } from './ProfileLink';
interface Props {
    search: string;
    setSearch: (value: string) => void;
    filteredArtists: Artist[];
    filteredArticles: ArticleRecord[];
    isOpen: boolean;
    onClose: () => void;
}
export function GlobalSearch({ search, setSearch, filteredArtists, filteredArticles, isOpen, onClose }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const previous = document.activeElement as HTMLElement | null;
        const node = dialog.current;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        node?.showModal();
        input.current?.focus();
        return () => { node?.close(); document.body.style.overflow = oldOverflow; previous?.focus({ preventScroll: true }); };
    }, [isOpen]);
    if (!isOpen)
        return null;
    return <dialog ref={dialog} className="search-dialog" aria-labelledby="search-title" onCancel={event => { event.preventDefault(); onClose(); }}><div className="search-heading"><h2 id="search-title">Search</h2><button onClick={onClose} aria-label="Close search">×</button></div><label><span className="sr-only">Search artists, galleries and stories</span><input ref={input} type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artists, galleries and stories"/></label><p className="search-summary" role="status">{search ? `${filteredArtists.length} profiles and ${filteredArticles.length} stories` : 'Search by name, title or topic.'}</p>{search && <><span className="eyebrow">Artists & spaces</span>{filteredArtists.filter(artist => artist.type !== 'collector').slice(0, 12).map(artist => <ProfileLink artist={artist} key={artist.id} onClick={onClose} className="search-result">{profileImage(artist, 100) && <img src={profileImage(artist, 100)} alt=""/>}<span>{artist.name}<small>{artist.subtitle}</small></span></ProfileLink>)}<span className="eyebrow">Content Lab</span>{filteredArticles.slice(0, 8).map(article => <Link className="search-result" key={article.id} to={`/blog/${article.id}/`} onClick={onClose}>{article.title}</Link>)}{!filteredArtists.length && !filteredArticles.length && <p>No matches. Try a different name or topic.</p>}</>}<Link className="text-link" to="/artists/" onClick={onClose}>Browse the complete directory</Link></dialog>;
}
