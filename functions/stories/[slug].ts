import { publicPageData, renderPublicDocument } from '../_lib/renderPublic';
import { articleMeta } from '../../src/lib/seo';
import { articleFilter, articleProjection, queryPublic, validArticle, type PublicArticle } from '../_lib/publicContent';
import { cachedPublicResponse, missingResponse, unavailableResponse, pageResponse, slashRedirect, type PageEnv } from '../_lib/seoResponse';
const renderArticle = async ({ request, env, params }: { request: Request; env: PageEnv; params: Record<string, string | string[]> }) => {
    try {
        const article = await queryPublic<PublicArticle | null>(`*[${articleFilter} && slug.current == $slug][0] ${articleProjection.replace('{', '{content, ')}`, env, { slug: String(params.slug) });
        if (article === null) return missingResponse(request, env);
        if (!validArticle(article)) throw new Error('Invalid public article');
        const redirect = slashRedirect(request); if (redirect) return redirect;
        const data = await publicPageData(env, article);
        return pageResponse(request, env, articleMeta(article), 200, html => renderPublicDocument(html, new URL(request.url).pathname, data));
    } catch { return unavailableResponse(request, env); }
};
export const onRequestGet = (context: Parameters<typeof renderArticle>[0]) => cachedPublicResponse(context.request, () => renderArticle(context), context.env);
export const onRequestHead = onRequestGet;
