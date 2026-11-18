import { SiteLink as Link } from './SiteLink';
import type { ArticleRecord } from '../types/article';
import { previewImage } from '../lib/editorial';
export function EditorialImage({ article, sizes = '(max-width: 700px) 100vw, 32vw' }: { article: ArticleRecord; sizes?: string }) {
    return <img src={previewImage(article.thumbnailUrl, 800)} srcSet={article.thumbnailUrl.startsWith('https://cdn.sanity.io/') ? [400, 800, 1280].map(w => `${previewImage(article.thumbnailUrl, w)} ${w}w`).join(', ') : undefined} sizes={sizes} alt="" loading="lazy" decoding="async" width="800" height="600" />;
}
export function EditorialCard({ article }: { article: ArticleRecord }) {
    return <article className="editorial-card"><Link to={`/stories/${article.id}/`}>
        <div className="editorial-image"><EditorialImage article={article} /></div>
        <div className="editorial-meta">{article.type === 'Interview' && <span className="interview-tag">Interview</span>}<span>{article.date}</span></div>
        <h3>{article.title}</h3><p>{article.excerpt}</p>
    </Link></article>;
}
