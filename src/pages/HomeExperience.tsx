import { Link } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';
import type { HomeSectionKey } from '../constants/homeSections';
import { WindowsCarousel } from '../components/WindowsCarousel';
import { EditorialCard, EditorialImage } from '../components/ContentLabSection';
import { useEditorialSelection } from '../hooks/useEditorialSelection';
import { selectEditorial } from '../lib/editorial';
interface Props {
    artists: Artist[];
    loading: boolean;
    artistsError?: string | null;
    articles: ArticleRecord[];
    articlesLoading: boolean;
    setIsLegalModalOpen: (open: boolean) => void;
    onSectionChange?: (section: HomeSectionKey) => void;
}
export function HomeExperience({ artists, loading, artistsError, articles, articlesLoading, setIsLegalModalOpen }: Props) {
    const selection = useEditorialSelection();
    const { lead, recent, selected } = selectEditorial(articles, selection);
    return <main id="main-content" className="windows-home">
    <section className="windows-opening" aria-label="Explore CATALOGUE">
      <div className="discovery-panel">
        <div className="discovery-heading"><span className="eyebrow">Independent worlds</span><span>{artists.filter(a => !a.type || a.type === 'artist').length} artists / {artists.filter(a => a.type === 'gallery' || a.type === 'collection').length} curated spaces</span></div>
        {loading ? <div className="windows-empty" role="status">Opening the directory…</div> : artists.length ? <WindowsCarousel artists={artists.filter(artist => artist.type !== 'collector')}/> : <div className="windows-empty"><p>{artistsError || 'The directory is currently unavailable.'}</p><button onClick={() => window.location.reload()}>Try again</button></div>}
      </div>
      <aside className="context-rail" aria-label="About CATALOGUE and latest story">
        <div className="catalogue-intro"><span className="eyebrow">A place to begin</span><h1>Digital art.<br />Independent worlds.</h1><p>An independent publication and directory for digital art. Read the stories, meet the artists, and explore the work through their own websites. Across mediums, platforms, and chains.</p><Link className="text-link" to="/info/">About CATALOGUE</Link></div>
        <div className="rail-story"><div className="rail-heading"><span className="eyebrow">Content Lab</span><Link to="/blog/">All stories</Link></div>{lead ? <article><Link to={`/blog/${lead.id}/`}><div className="rail-image"><EditorialImage article={lead} sizes="(max-width: 900px) 100vw, 25vw"/></div><span className="story-date">{lead.date}</span><h2>{lead.title}</h2></Link></article> : <p role="status">{articlesLoading ? 'Loading stories…' : 'New perspectives are on their way.'}</p>}</div>
      </aside>
    </section>
    <section className="windows-editorial" aria-labelledby="recent-title"><div className="section-heading"><div><span className="eyebrow">Content Lab / Recent stories</span><h2 id="recent-title">Art, in context.</h2></div><Link className="text-link" to="/blog/">Explore the publication</Link></div><div className="editorial-grid">{recent.map(article => <EditorialCard key={article.id} article={article}/>)}</div></section>
    {selected.length > 0 && <section className="windows-editorial picks" aria-labelledby="picks-title"><div className="section-heading"><div><span className="eyebrow">From the editor</span><h2 id="picks-title">Worth returning to.</h2></div></div><div className="editorial-grid">{selected.map(article => <EditorialCard key={article.id} article={article}/>)}</div></section>}
    <section className="join-catalogue"><span className="eyebrow">For artists & galleries</span><h2>Your website.<br />Your world.</h2><p>Submit your artist or gallery profile for review.</p><Link className="solid-link" to="/submit/">Apply to CATALOGUE</Link></section>
    <footer className="windows-footer"><Link to="/">CATALOGUE.gallery</Link><nav aria-label="Footer"><Link to="/info/">About</Link><Link to="/artists/">Directory</Link><Link to="/blog/">Content Lab</Link><a href="https://x.com/CatalogueART" target="_blank" rel="noreferrer">@CatalogueART</a><button onClick={() => setIsLegalModalOpen(true)}>Policy</button></nav></footer>
  </main>;
}
