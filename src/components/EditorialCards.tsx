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

/** Keep the original chronology while giving two images room to carry a spread. */
export function HomeReadingList({ stories }: { stories: ArticleRecord[] }) {
    if (!stories.length) return null;
    return <div className="home-reading-list">{stories.map((story,index) => {
        const feature = index === 0 || (index === 5 && stories.length >= 7);
        const className = feature ? 'story-spread' + (index === 0 ? '' : ' reversed') : 'story-line';
        return <article key={story.id} className={className}>
            <Link to={'/stories/' + story.id + '/'}>
                {story.thumbnailUrl && <div className="story-plate"><EditorialImage article={story} sizes={feature?'(max-width: 760px) 100vw, 58vw':'(max-width: 760px) 72px, 124px'}/></div>}
                <div className="story-text">
                    <div className="story-dateline"><span>{story.date}</span>{story.type==='Interview'&&<span>Interview</span>}</div>
                    <h3>{story.title}</h3>
                    {feature && <><p>{story.excerpt}</p><span className="story-read">Read story <span aria-hidden="true">↗</span></span></>}
                </div>
                {!feature && <span className="story-direction" aria-hidden="true">↗</span>}
            </Link>
        </article>;
    })}</div>;
}
