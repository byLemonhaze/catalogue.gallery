import { publicDispatches } from './_lib/publicDispatch';
import { dispatchMeta } from '../src/lib/dispatch';
import { sitemapXml, staticPages, profileMeta, articleMeta } from '../src/lib/seo';
import { publicInventory, type PublicEnv } from './_lib/publicContent';
export const onRequestGet = async ({ env }: { env: PublicEnv }) => {
    try {
        const [{profiles, articles}, dispatches] = await Promise.all([publicInventory(env), publicDispatches(env)]);
        const entries = [
            ...dispatches.map(post => ({path:dispatchMeta(post).path, updatedAt:post.publishedAt})),
            ...staticPages.filter(page => !page.noindex),
            ...profiles.map(profile => ({ path: profileMeta(profile).path, updatedAt: profile.updatedAt })),
            ...articles.map(article => ({ path: articleMeta(article).path, updatedAt: article.updatedAt })),
        ];
        return new Response(sitemapXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate' } });
    } catch {
        return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
    }
};
