import { useEffect, useMemo, useRef, useState } from 'react';
import { useArtists, type Artist } from '../hooks/useArtists';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { profileImage } from '../lib/profilePresentation';
import { sortDirectory, shuffleDirectory, type DirectoryOrder } from '../lib/directoryOrder';
import { ProfileLink } from './ProfileLink';

const kindName = (artist: Artist) => artist.type === 'gallery' || artist.type === 'collection' ? 'Curated space' : 'Artist';
function initial(name: string) {
    const letter = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
    return /^[A-Z]$/.test(letter) ? letter : '#';
}

export function ArtistList() {
    const { artists, loading, error } = useArtists();
    const [query, setQuery] = useState('');
    const [kind, setKind] = useState('All');
    const [layout, setLayout] = useState<'preview' | 'list'>('preview');
    const [order, setOrder] = useState<DirectoryOrder>('az');
    const [shuffledIds, setShuffledIds] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [readyImage, setReadyImage] = useState<string | null>(null);
    const [failedImage, setFailedImage] = useState<string | null>(null);
    const [reduced] = useMotionPreference();
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(hoverTimer.current), []);
    const select = (id: string) => { clearTimeout(hoverTimer.current); setActiveId(id); };
    const reshuffle = () => { setShuffledIds(shuffleDirectory(artists)); setOrder('shuffle'); setActiveId(null); };
    const filtered = useMemo(() => {
        const match = query.trim().toLowerCase();
        return sortDirectory(artists.filter(artist => artist.type !== 'collector'
            && (kind === 'All' || (kind === 'Artists' ? kindName(artist) === 'Artist' : kindName(artist) === 'Curated space'))
            && (artist.name + ' ' + (artist.subtitle || '')).toLowerCase().includes(match)), order, shuffledIds);
    }, [artists, kind, query, order, shuffledIds]);
    const index = Math.max(0, filtered.findIndex(artist => artist.id === activeId));
    const current = filtered[index];
    const picture = current && profileImage(current, 1100);
    // Keep the previous plate and its own credit together while the next image loads.
    const previous = picture && readyImage && readyImage !== current.id && failedImage !== picture
        ? filtered.find(artist => artist.id === readyImage) : undefined;
    const shown = previous || current;
    const shownPicture = shown && profileImage(shown, 1100);
    const alphabetical = order === 'az' || order === 'za';
    const letters = alphabetical ? [...new Set(filtered.map(artist => initial(artist.name)))] : [];
    const step = (n: number) => select(filtered[(index + n + filtered.length) % filtered.length].id);

    return <main id="main-content" className={'directory-page artist-register' + (reduced ? ' is-reduced' : '')}>
        <div className="page-heading"><h1>Artists &amp; Galleries</h1></div>
        <div className="directory-tools">
            <label className="directory-search"><span className="sr-only">Search directory</span><input type="search" value={query} onChange={e => {setQuery(e.target.value);setActiveId(null);}} placeholder="Find an artist or gallery"/></label>
            <div className="filter-tabs" role="group" aria-label="Profile type">{['All','Artists','Galleries'].map(value => <button key={value} aria-pressed={kind === value} onClick={() => {setKind(value);setActiveId(null);}}>{value}</button>)}</div>
            <label className="directory-sort"><span>Sort</span><select aria-label="Sort directory" value={order} onChange={e => {const next=e.target.value as DirectoryOrder;if(next==='shuffle') reshuffle();else {setOrder(next);setActiveId(null);}}}>
                <option value="az">Name A–Z</option><option value="za">Name Z–A</option><option value="newest">Recently added</option><option value="shuffle">Shuffle</option>
            </select></label>
            <button className="directory-shuffle" onClick={reshuffle}>{order === 'shuffle' ? 'Reshuffle' : 'Shuffle'}</button>
            <div className="filter-tabs" role="group" aria-label="Directory layout">{(['preview','list'] as const).map(value => <button key={value} aria-pressed={layout===value} onClick={() => setLayout(value)}>{value==='preview'?'Artwork':'Names'}</button>)}</div>
        </div>
        <p className="directory-count" role="status">{loading?'Loading directory…':filtered.length+' '+(filtered.length===1?'profile':'profiles')}</p>
        {error && !artists.length ? <div role="alert"><p>{error}</p><button className="text-link" onClick={() => window.location.reload()}>Try again</button></div>
        : !loading && !current ? <div className="empty-results" role="status"><p>No matching profiles. Try a different name or filter.</p><button className="text-link" onClick={() => {setQuery('');setKind('All');}}>Reset search and filters</button></div>
        : current && <div className={'register-layout register-' + layout}>
            {layout==='preview' && <aside className="register-preview" aria-label="Artwork preview">
                <ProfileLink artist={shown} className="register-plate" aria-label={'Open profile for '+shown.name} aria-busy={Boolean(previous)}>
                    <span className="register-initial" aria-hidden="true">{shown.name.charAt(0)}</span>
                    {shownPicture && shownPicture!==failedImage && <img key={shown.id} src={shownPicture} alt={'Preview for '+shown.name} decoding="async"
                        onLoad={()=>setReadyImage(shown.id)} onError={()=>setFailedImage(shownPicture)}/>}
                    {previous && <img className="register-pending" key={current.id} src={picture} alt="" aria-hidden="true" decoding="async"
                        onLoad={()=>setReadyImage(current.id)} onError={()=>setFailedImage(picture || null)}/>}
                </ProfileLink>
                <div className="register-credit">
                    <div><span className="register-type">{kindName(shown)}</span><strong>{shown.name}</strong>{shown.subtitle && <p>{shown.subtitle}</p>}</div>
                    <div className="register-steps" role="group" aria-label="Browse artwork previews">
                        {filtered.length>1 && <><button type="button" aria-label="Previous artwork" onClick={()=>step(-1)}>←</button><button type="button" aria-label="Next artwork" onClick={()=>step(1)}>→</button></>}
                    </div>
                </div>
                <ProfileLink artist={shown} className="text-link">Open profile <span aria-hidden="true">↗</span></ProfileLink>
            </aside>}
            <div className="register-names">
                {letters.length>1 && <label className="register-jump">Jump to letter
                    <select aria-label="Jump to letter" value="" onChange={e=>{
                        const first=filtered.find(artist=>initial(artist.name)===e.target.value);
                        if(!first)return;
                        const row=document.getElementById('register-'+first.id);
                        row?.querySelector('a')?.focus({preventScroll:true});row?.scrollIntoView({block:'center'});select(first.id);
                    }}><option value="" disabled>A–Z</option>{letters.map(letter=><option key={letter} value={letter}>{letter}</option>)}</select>
                </label>}
                <ol>{filtered.map((artist,i)=>{
                    const group=alphabetical&&(i===0||initial(artist.name)!==initial(filtered[i-1].name))?initial(artist.name):null;
                    return <li key={artist.id} id={'register-'+artist.id} data-selected={layout==='preview'&&artist.id===current.id}>
                        <ProfileLink artist={artist} className="register-row" onFocus={()=>select(artist.id)}
                            onPointerEnter={e=>{if(e.pointerType==='mouse'&&layout==='preview'){clearTimeout(hoverTimer.current);hoverTimer.current=setTimeout(()=>select(artist.id),65);}}}
                            onPointerLeave={()=>clearTimeout(hoverTimer.current)}>
                            <span className="register-letter" aria-hidden="true">{group}</span>
                            <div><h2>{artist.name}</h2>{artist.subtitle&&<p>{artist.subtitle}</p>}</div>
                            <span className="register-open" aria-hidden="true">↗</span>
                        </ProfileLink>
                    </li>;
                })}</ol>
            </div>
        </div>}
    </main>;
}
