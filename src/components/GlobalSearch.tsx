import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';
import { profileImage } from '../lib/profilePresentation';
import { ProfileLink } from './ProfileLink';
import { useDispatches } from '../hooks/useDispatches';
import { matchesDispatch } from '../lib/dispatch';
interface Props {
    search: string;
    setSearch: (value: string) => void;
    filteredArtists: Artist[];
    filteredArticles: ArticleRecord[];
    isOpen: boolean;
    onClose: () => void;
}
export function GlobalSearch({ search, setSearch, filteredArtists, filteredArticles, isOpen, onClose }: Props) {
    const editions = useDispatches(isOpen);
    const query = search.trim();
    const filteredEditions = editions.filter(post => matchesDispatch(post, query));
    const profiles = filteredArtists.filter(artist => artist.type !== 'collector');
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
    return <dialog ref={dialog} className="search-dialog" aria-labelledby="search-title" onCancel={event => { event.preventDefault(); onClose(); }}>
        <div className="search-heading"><h2 id="search-title">Search</h2><button onClick={onClose} aria-label="Close search">×</button></div>
        <label><span className="sr-only">Search artists, galleries, stories and DISPATCH</span><input ref={input} type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, story, topic or edition date"/></label>
        <p className="search-summary" role="status">{query ? `${profiles.length} ${profiles.length === 1 ? 'profile' : 'profiles'} · ${filteredArticles.length} ${filteredArticles.length === 1 ? 'story' : 'stories'} · ${filteredEditions.length} ${filteredEditions.length === 1 ? 'edition' : 'editions'}` : 'Artists, galleries, Content Lab stories and daily DISPATCH editions.'}</p>
        {query && <>
            {!!profiles.length && <section aria-label="Artists and galleries"><span className="eyebrow">Artists & spaces</span>{profiles.slice(0, 12).map(artist => <ProfileLink artist={artist} key={artist.id} onClick={onClose} className="search-result">{profileImage(artist, 100) && <img src={profileImage(artist, 100)} alt=""/>}<span>{artist.name}{' '}<small>{artist.subtitle}</small></span></ProfileLink>)}</section>}
            {!!filteredArticles.length && <section aria-label="Content Lab stories"><span className="eyebrow">Content Lab</span>{filteredArticles.slice(0, 8).map(article => <Link className="search-result" key={article.id} to={`/blog/${article.id}/`} onClick={onClose}>{article.title}</Link>)}</section>}
            {!!filteredEditions.length && <section aria-label="DISPATCH editions"><span className="eyebrow">DISPATCH</span>{filteredEditions.slice(0, 8).map(post => <Link className="search-result" key={post.id} to={`/dispatch/${post.slug}/`} onClick={onClose}><span>{post.title}{' '}<small>{post.summary}</small></span></Link>)}</section>}
            {!profiles.length && !filteredArticles.length && !filteredEditions.length && <p className="search-empty">No matches. Try another name, topic or edition date.</p>}
        </>}
        <Link className="text-link" to="/artists/" onClick={onClose}>Browse the complete directory</Link>
    </dialog>;
}
