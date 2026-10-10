export interface PublicEnv { SANITY_PROJECT_ID?: string; VITE_SANITY_PROJECT_ID?: string; SANITY_DATASET?: string; VITE_SANITY_DATASET?: string }
export interface PublicProfile { id: string; type: 'artist' | 'gallery'; name: string; subtitle: string; websiteUrl?: string; thumbnailUrl?: string; updatedAt?: string; desktopExitPosition?: string; mobileExitPosition?: string; thumbnail?: unknown }
export interface PublicArticle { id: string; title: string; excerpt: string; thumbnailUrl?: string; updatedAt?: string; author?: string; displayDate?: string; publishedAt?: string; type?: string; content?: string; featuredArtistId?: string; featuredArtistType?: string }
export const profileFilter = '_type in ["artist", "gallery"] && !(_id in path("drafts.**")) && (status == "published" || !defined(status))';
export const articleFilter = '_type == "post" && !(_id in path("drafts.**")) && defined(slug.current) && defined(content) && content != ""';
export const profileProjection = '{"id": coalesce(slug.current, _id), "type": _type, name, subtitle, websiteUrl, thumbnail, desktopExitPosition, mobileExitPosition, "thumbnailUrl": thumbnail.asset->url, "updatedAt": _updatedAt}';
export const articleProjection = '{"id": slug.current, title, excerpt, author, displayDate, publishedAt, type, "featuredArtistId": featuredArtist->slug.current, "featuredArtistType": featuredArtist->_type, "thumbnailUrl": coalesce(featuredArtist->thumbnail.asset->url, thumbnail.asset->url, thumbnailPath), "updatedAt": _updatedAt}';
export async function queryPublic<T>(query: string, env: PublicEnv = {}, params: Record<string, string> = {}): Promise<T> {
    const project = env.SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo';
    const dataset = env.SANITY_DATASET || env.VITE_SANITY_DATASET || 'production';
    const url = new URL(`https://${project}.api.sanity.io/v2024-01-01/data/query/${dataset}`);
    url.searchParams.set('query', query); url.searchParams.set('perspective', 'published');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(`$${key}`, JSON.stringify(value));
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Public content request failed (${response.status})`);
    const data = await response.json() as { result?: T };
    if (!Object.prototype.hasOwnProperty.call(data, 'result')) throw new Error('Public content response has no result');
    return data.result as T;
}
export function validProfile(value: PublicProfile) { return Boolean(value.id && value.name && ['artist', 'gallery'].includes(value.type)); }
export function validArticle(value: PublicArticle) { return Boolean(value.id && value.title && value.excerpt); }
export async function publicInventory(env: PublicEnv = {}, includeContent = false) {
    const [profiles, articles] = await Promise.all([
        queryPublic<PublicProfile[]>(`*[${profileFilter}] | order(name asc) ${profileProjection}`, env),
        queryPublic<PublicArticle[]>(`*[${articleFilter}] | order(coalesce(publishedAt, _createdAt) desc) ${includeContent ? articleProjection.replace('{', '{content, ') : articleProjection}`, env),
    ]);
    if (!Array.isArray(profiles) || !Array.isArray(articles) || !profiles.every(validProfile) || !articles.every(validArticle)) throw new Error('Public content inventory is invalid');
    return { profiles, articles };
}
