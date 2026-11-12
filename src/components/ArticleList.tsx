import type { ArticleRecord } from '../types/article';
import { EditorialCard } from './ContentLabSection';
export function ArticleList({ articles, loading = false }: { filter?: 'interview' | 'blog' | 'all'; articles: ArticleRecord[]; loading?: boolean }) {
    return <main id="main-content" className="story-archive min-h-screen px-6 pt-16 pb-24"><div className="editorial-inner">
        <span className="editorial-kicker">Content Lab</span><h1 className="editorial-index-title">Digital art, in context.</h1><p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60">Explore the artists, ideas, and conversations shaping digital culture. Start somewhere new, or return to a story that stays with you.</p>
        <h2 className="archive-label">All stories</h2>
        <p className="sr-only" role="status">{articles.length} {articles.length === 1 ? 'story' : 'stories'}</p>
        {loading && !articles.length ? <p role="status" className="editorial-status">Loading stories…</p> : articles.length ? <div className="editorial-grid">{articles.map(article => <EditorialCard key={article.id} article={article} />)}</div> : <p className="editorial-status">New perspectives are on their way. Explore the artist directory.</p>}
    </div></main>;
}
