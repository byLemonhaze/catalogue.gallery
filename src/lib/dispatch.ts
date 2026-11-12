import archive from '../data/dispatch-archive.json';
import type { PageMeta } from './seo';
export interface DispatchItem { number: number; headline: string; body: string; sources?: {label: string; url: string}[]; plateUrl?: string; plateAlt?: string; plateCredit?: string; artists?: {id: string; name: string; type: string}[]; relatedPosts?: {id: string; title: string}[] }
export interface DispatchPost { id: string; slug?: string; title: string; issueDate?: string; dateDisplay?: string; publishedAt: string; summary: string; body?: string; xUrl?: string; coverUrl?: string | null; coverAlt?: string; items?: DispatchItem[]; plates?: {url: string; alt: string}[]; archiveSource?: string }
export const dispatchQuery = `*[_type == "dispatch" && !(_id in path("drafts.**")) && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now()) && defined(slug.current)] | order(issueDate desc){"id": _id, "slug": slug.current, title, issueDate, dateDisplay, publishedAt, archiveSource, "summary": coalesce(dek, summary, items[0].headline), body, "xUrl": coalesce(xPostUrl, xUrl), "coverUrl": cover.asset->url, "coverAlt": cover.alt, items[]{number, headline, body, sources, "plateUrl": plate.asset->url, "plateAlt": plate.alt, "plateCredit": plate.credit, "artists": artists[!(_ref in path("drafts.**"))]->{"id": slug.current, name, "type": _type}, "relatedPosts": relatedPosts[!(_ref in path("drafts.**"))]->{"id": slug.current, title}}, plates[]{"url": asset->url, alt}}`;
export function mergeDispatches(live: DispatchPost[] = [], now = Date.now()): DispatchPost[] {
    const published = [...archive, ...live].filter(p => p.slug && /^\d{4}-\d{2}-\d{2}$/.test(p.slug) && !p.id.startsWith('drafts.') && Date.parse(p.publishedAt) <= now);
    return [...new Map(published.map(p => [p.slug, p])).values()].sort((a,b) => (b.issueDate || b.slug || '').localeCompare(a.issueDate || a.slug || ''));
}
export function safeSourceUrl(value?: string) {
    if (!value) return undefined;
    try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined; } catch { return undefined; }
}
export function dispatchLink(value?: string) {
    const safe = safeSourceUrl(value); if (!safe) return undefined;
    const url = new URL(safe);
    return url.protocol === 'https:' && ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname) ? url.href : undefined;
}
export function dispatchMeta(post: DispatchPost): PageMeta {
    return {path: `/dispatch/${post.slug}/`, title: `${post.title} | CATALOGUE`, description: post.summary, type:'article', image:post.coverUrl || undefined, article:{title:post.title,author:'CATALOGUE',publishedAt:post.publishedAt}};
}

/** One consistent media order for archive previews and the full edition viewer. */
export function dispatchMedia(post: DispatchPost) {
    return [
        ...(post.coverUrl ? [{url:post.coverUrl,alt:post.coverAlt || post.title,label:'Cover'}] : []),
        ...(post.plates || []).map((plate,i)=>({...plate,label:`Plate ${String(i+1).padStart(2,'0')}`})),
        ...(post.items || []).filter(item=>item.plateUrl).map(item=>({url:item.plateUrl!,alt:item.plateAlt || item.headline,label:`Story ${String(item.number).padStart(2,'0')}`})),
    ].filter((item,index,all)=>all.findIndex(other=>other.url===item.url)===index);
}
