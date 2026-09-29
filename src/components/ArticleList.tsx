import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import type { ArticleRecord } from '../types/article';
import { EditorialCard } from './ContentLabSection';
export function ArticleList({ filter = 'all', articles, loading = false }: { filter?: 'interview' | 'blog' | 'all'; articles: ArticleRecord[]; loading?: boolean }) {
    const [kind, setKind] = useState(filter === 'interview' ? 'Interview' : filter === 'blog' ? 'Blog' : 'All stories');
    const selected = articles.filter(article => kind === 'All stories' || article.type === kind);
    return <main className="min-h-screen px-6 pt-36 md:pt-32 pb-24"><Helmet><title>Content Lab | CATALOGUE</title><meta name="description" content="Stories, conversations, and critical perspectives on digital art. Explore Content Lab, the publication from CATALOGUE." /></Helmet><div className="editorial-inner">
        <span className="editorial-kicker">Content Lab</span><h1 className="editorial-index-title">Digital art, in context.</h1><p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60">Explore the artists, ideas, and conversations shaping digital culture. Start somewhere new, or return to a story that stays with you.</p>
        <div className="editorial-filters" role="group" aria-label="Filter stories">{['All stories', 'Article', 'Blog', 'Interview'].map(type => <button key={type} aria-pressed={kind === type} onClick={() => setKind(type)}>{({ Article: 'Articles', Blog: 'Notes', Interview: 'Interviews' } as Record<string, string>)[type] || type}</button>)}</div>
        <p className="sr-only" role="status">{selected.length} {selected.length === 1 ? 'story' : 'stories'}</p>
        {loading && !articles.length ? <p role="status" className="editorial-status">Loading stories…</p> : selected.length ? <div className="editorial-grid">{selected.map(article => <EditorialCard key={article.id} article={article} />)}</div> : <p className="editorial-status">No stories in this section yet. Explore all stories above.</p>}
    </div></main>;
}
