import { ProfileName } from '../components/ProfileName';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useArtists } from '../hooks/useArtists';
import { readProfileBootstrap, externalOnlyProfiles } from '../lib/profileBootstrap';
import { officialWebsite, profileImage, profilePath } from '../lib/profilePresentation';
import { missingMeta, profileMeta } from '../lib/seo';
import { ProfileSurface } from '../components/ProfileSurface';
import { Seo } from '../components/Seo';
export function ArtistProfile({ modal = false }: {
    modal?: boolean;
}) {
    const { id = '' } = useParams();
    const location = useLocation(), navigate = useNavigate();
    const type = location.pathname.startsWith('/gallery/') ? 'gallery' : 'artist';
    const { artists, loading, error } = useArtists();
    const [bootstrap] = useState(() => readProfileBootstrap(id, type));
    const artist = artists.find(item => item.id === id && (item.type || 'artist') === type) || ((loading || error) ? bootstrap : null);
    const dialog = useRef<HTMLDialogElement>(null);
    const openerId = (location.state as {profileOpener?: string} | null)?.profileOpener;
    useEffect(() => {
        if (!modal)
            return;
        const previous = (openerId ? document.getElementById(openerId) : null) || document.activeElement as HTMLElement | null;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const node = dialog.current;
        node?.showModal();
        node?.querySelector<HTMLButtonElement>('.profile-close')?.focus();
        return () => { node?.close(); document.body.style.overflow = oldOverflow; previous?.focus({ preventScroll: true }); };
    }, [modal, openerId]);
    const enterFromCard = (event: MouseEvent<HTMLDivElement>) => {
        if (!artist || !officialWebsite(artist.websiteUrl) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = event.target as HTMLElement;
        if (target.closest('a, button, input, textarea, select, summary, details') || window.getSelection()?.toString()) return;
        navigate(`${profilePath(artist)}world/`, { state: { ...location.state, from: 'profile' } });
    };
    const content = artist ? <>
    <Seo meta={profileMeta({ ...artist, type, image: profileImage(artist) })}/>
    <ProfileSurface key={artist.id} website={externalOnlyProfiles.has(artist.id) ? undefined : officialWebsite(artist.websiteUrl)} src={profileImage(artist, 1200)} name={artist.name} framed={Boolean(artist.shortBio?.trim())} to={officialWebsite(artist.websiteUrl) ? `${profilePath(artist)}world/` : undefined} state={{ ...location.state, from: 'profile' }}/>
    <div className="profile-copy"><span className="eyebrow">{type === 'gallery' ? 'Curated space' : 'Artist universe'}</span><ProfileName name={artist.name}/><p className="profile-subtitle">{artist.subtitle}</p>{artist.shortBio?.trim() && <p className="profile-bio">{artist.shortBio}</p>}
      {officialWebsite(artist.websiteUrl) ? <><Link className="solid-link" to={`${profilePath(artist)}world/`} state={{ ...location.state, from: 'profile' }}>Enter world</Link></> : <p>The artist’s website is currently unavailable.</p>}
      {externalOnlyProfiles.has(artist.id) && <p className="profile-embed-note">This website opens separately. Its owner does not allow embedded viewing.</p>}
      <Link to="/artists/" className="text-link profile-browse">Browse the directory</Link>
    </div>
  </> : <div className="profile-copy">{!loading && !error && <Seo meta={missingMeta(location.pathname)}/>}<h1 id="profile-title">{loading ? 'Finding this artist…' : error ? 'The directory could not load.' : 'This profile is not available.'}</h1><p>{error || (!loading ? 'The artist may have moved, or this link is out of date.' : '')}</p>{error && <button onClick={() => window.location.reload()}>Try again</button>}<Link to="/artists/" className="text-link profile-browse">Browse the directory</Link></div>;
    return modal ? <dialog ref={dialog} className="profile-dialog" aria-labelledby="profile-title" onCancel={event => { event.preventDefault(); navigate(-1); }} onClick={event => { if (event.target === event.currentTarget) {
        const r = event.currentTarget.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)
            navigate(-1);
    } }}><button className="profile-close" aria-label="Close artist profile" onClick={() => navigate(-1)}>×</button><div className="profile-layout" onClick={enterFromCard}>{content}</div></dialog> : <main id="main-content" className="profile-page"><Link className="text-link profile-directory" to="/artists/">Directory</Link><div className="profile-layout" onClick={enterFromCard}>{content}</div></main>;
}
