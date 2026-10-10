import type { PublicPageData } from '../../src/lib/publicPageData';
import type { Artist } from '../../src/hooks/useArtists';
import { publicationDate } from '../../src/lib/publicationDate';
import { publicInventory, queryPublic, type PublicEnv, type PublicArticle } from './publicContent';
import type { EditorialSelection } from '../../src/lib/editorial';
// Built by Vite before Pages Functions are bundled by Wrangler.
// @ts-expect-error generated server entry has no declaration file
import { renderPublicPage } from '../../server-dist/entry-server.js';
export async function publicPageData(env: PublicEnv = {}, article?: PublicArticle): Promise<PublicPageData> {
    const [inventory, editorial] = await Promise.all([
        publicInventory(env),
        queryPublic<EditorialSelection | null>('*[_type == "homepageEditorial" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{"lead": lead->slug.current, "selected": selected[]->slug.current}', env),
    ]);
    // One random order per response, shared with the browser for stable hydration.
    const artists = inventory.profiles.map(profile => ({ ...profile, thumbnail: profile.thumbnail, isSanity: true })) as Artist[];
    for (let i = artists.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [artists[i], artists[j]] = [artists[j], artists[i]]; }
    return { artists, editorial, articles: inventory.articles.map(item => {
        const value = article?.id === item.id ? article : item;
        const publishedAt = publicationDate(value.publishedAt, value.displayDate);
        return { ...value, author: value.author || 'CATALOGUE', date: value.displayDate || (publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''), publishedAt, type: value.type || 'Article', content: value.content || '', thumbnailUrl: value.thumbnailUrl || '/logo.png', source: 'sanity' as const };
    }) };
}
export async function renderPublicDocument(template: string, path: string, data: PublicPageData) {
    const body = await renderPublicPage(path, data);
    const bootstrap = JSON.stringify(data).replace(/</g, '\\u003c');
    return template.replace('<div id="root"></div>', `<div id="root">${body}</div>`).replace('</head>', `<script id="catalogue-public-data" type="application/json">${bootstrap}</script></head>`);
}
