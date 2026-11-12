import { Link } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';
import type { HomeSectionKey } from '../constants/homeSections';
import { WindowsCarousel } from '../components/WindowsCarousel';
import { DispatchSection } from '../components/DispatchSection';
import { EditorialCard } from '../components/ContentLabSection';
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
    const stories = articles.slice(0, 9);
    return <main id="main-content" className="windows-home">
    <section className="windows-opening" aria-label="Explore CATALOGUE">
      <div className="discovery-panel">
        <div className="discovery-heading"><span className="eyebrow">A directory of digital artists</span><span>{artists.filter(a => !a.type || a.type === 'artist').length} artists / {artists.filter(a => a.type === 'gallery' || a.type === 'collection').length} curated spaces</span></div>
        {loading ? <div className="windows-empty" role="status">Opening the directory…</div> : artists.length ? <WindowsCarousel artists={artists.filter(artist => artist.type !== 'collector')}/> : <div className="windows-empty"><p>{artistsError || 'The directory is currently unavailable.'}</p><button onClick={() => window.location.reload()}>Try again</button></div>}
      </div>
      <aside className="context-rail" aria-label="About CATALOGUE and DISPATCH">
        <div className="catalogue-intro"><h1>A place to begin digital art in the independent world</h1><p>An independent publication and directory for digital art. Read the stories, meet the artists, and explore the work through their own websites.</p><Link className="text-link" to="/info/">About CATALOGUE</Link></div>
        <DispatchSection/>
      </aside>
    </section>
    <section className="windows-editorial" aria-labelledby="recent-title"><div className="section-heading"><div><span className="eyebrow">Content Lab</span><h2 id="recent-title">Digital art, in context.</h2></div><Link className="text-link" to="/blog/">All stories</Link></div>{articlesLoading && !stories.length ? <p role="status">Loading stories…</p> : <div className="editorial-grid">{stories.map(article => <EditorialCard key={article.id} article={article}/>)}</div>}</section>
    <section className="join-catalogue"><span className="eyebrow">Apply + About</span><h2>Your practice. Your perspective. Your place here.</h2><p>Have an artist website or a gallery programme to share? Send it our way. Every application is reviewed before it joins the directory.</p><Link className="solid-link" to="/submit/">Apply now</Link></section>
    <footer className="windows-footer"><Link to="/">CATALOGUE.gallery</Link><nav aria-label="Footer"><Link to="/info/">About</Link><Link to="/artists/">Directory</Link><Link to="/blog/">Content Lab</Link><a href="https://x.com/CatalogueART" target="_blank" rel="noreferrer">@CatalogueART</a><button onClick={() => setIsLegalModalOpen(true)}>Policy</button></nav></footer>
  </main>;
}
