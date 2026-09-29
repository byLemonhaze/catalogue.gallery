import { Link } from 'react-router-dom';
import type { ArticleRecord } from '../types/article';
import { previewImage, selectEditorial, type EditorialSelection } from '../lib/editorial';
import { EDITOR_PICKS_SECTION_ID, HOME_SECTION_IDS } from '../constants/homeSections';
export function EditorialImage({ article, sizes = '(max-width: 700px) 100vw, 32vw' }: { article: ArticleRecord; sizes?: string }) {
    return <img src={previewImage(article.thumbnailUrl, 800)} srcSet={article.thumbnailUrl.startsWith('https://cdn.sanity.io/') ? [400, 800, 1280].map(w => `${previewImage(article.thumbnailUrl, w)} ${w}w`).join(', ') : undefined} sizes={sizes} alt="" loading="lazy" decoding="async" width="800" height="600" />;
}
export function EditorialCard({ article }: { article: ArticleRecord }) {
    return <article className="editorial-card"><Link to={`/blog/${article.id}/`}>
        <div className="editorial-image"><EditorialImage article={article} /></div>
        <div className="editorial-meta"><span>{article.type}</span><span>{article.date}</span></div>
        <h3>{article.title}</h3><p>{article.excerpt}</p>
    </Link></article>;
}
interface EditorialSectionProps {
    articles: ArticleRecord[];
    loading: boolean;
    selection?: EditorialSelection | null;
}
export function ContentLabSection({ articles, loading, selection }: EditorialSectionProps) {
    const { lead, recent } = selectEditorial(articles, selection);
    return <section id={HOME_SECTION_IDS.lab} className="editorial-section">
        <div className="editorial-inner">
            <div className="editorial-heading" data-home-scroll-anchor="true"><div><span className="editorial-kicker">Content Lab</span><h2>Digital art,<br />in context.</h2></div><div className="editorial-intro"><p>Stories, conversations, and critical perspectives on the artists and ideas shaping digital culture.</p><Link className="editorial-link" to="/blog">Explore all stories</Link></div></div>
            {loading && !lead ? <p role="status" className="editorial-status">Loading stories…</p> : !lead ? <p className="editorial-status">New perspectives are on their way. Explore the artist directory.</p> : <>
                <article className="editorial-lead">
                    <Link to={`/blog/${lead.id}/`} className="editorial-lead-image" aria-label={`Read ${lead.title}`}><EditorialImage article={lead} sizes="(max-width: 700px) 100vw, 58vw" /></Link>
                    <div className="editorial-lead-copy"><span className="editorial-kicker">{selection?.lead === lead.id ? 'Selected feature' : 'The latest story'}</span><div className="editorial-meta"><span>{lead.type}</span><span>{lead.date}</span></div><Link to={`/blog/${lead.id}/`}><h3>{lead.title}</h3></Link><p>{lead.excerpt}</p><div className="editorial-lead-foot"><span>By {lead.author}</span><Link className="editorial-link" to={`/blog/${lead.id}/`}>Read story</Link></div></div>
                </article>
                {recent.length > 0 && <div className="editorial-recent"><div><span className="editorial-kicker">Recent stories</span><h3>On our radar.</h3></div><div className="editorial-recent-list">{recent.map((article, index) => <Link key={article.id} to={`/blog/${article.id}/`}><span className="editorial-number">0{index + 1}</span><div><div className="editorial-meta"><span>{article.type}</span><span>{article.date}</span></div><h4>{article.title}</h4></div></Link>)}</div></div>}
            </>}
            <div className="editorial-directory-note"><p>Keep exploring. Every practice has its own world.</p><Link className="editorial-link" to="/artists">Meet the artists</Link></div>
        </div>
    </section>;
}

export function EditorPicksSection({ articles, loading, selection }: EditorialSectionProps) {
    const { selected } = selectEditorial(articles, selection);
    if (!selected.length && !loading) return null;

    return <section id={EDITOR_PICKS_SECTION_ID} className="editorial-section" aria-labelledby="editor-picks-title">
        <div className="editorial-inner editorial-shelf">
            <div className="editorial-shelf-heading">
                <div><span className="editorial-kicker">From the editor</span><h3 id="editor-picks-title">Worth returning to.</h3></div>
                <p>A closer look at the practices, questions,<br className="hidden md:block" /> and conversations that stay with us.</p>
            </div>
            {loading && !selected.length ? <p role="status" className="editorial-status">Loading stories…</p> :
                <div className="editorial-grid">{selected.map(article => <EditorialCard key={article.id} article={article} />)}</div>}
        </div>
    </section>;
}
