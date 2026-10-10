import { staticPages, canonicalPath } from '../src/lib/seo';
import { cachedPublicResponse, pageResponse, unavailableResponse, slashRedirect, type PageEnv } from './_lib/seoResponse';
import { publicPageData, renderPublicDocument } from './_lib/renderPublic';
interface Context { request: Request; env: PageEnv; next(): Promise<Response> }
export async function onRequest({ request, env, next }: Context) {
    const url = new URL(request.url);
    if (['www.catalogue.gallery', 'artfinder.pages.dev', 'production.artfinder.pages.dev'].includes(url.hostname)) {
        url.hostname = 'catalogue.gallery'; url.protocol = 'https:';
        return Response.redirect(url.href, 301);
    }
    if (url.pathname.startsWith('/app-shell')) return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
    const meta = staticPages.find(page => !page.noindex && page.path === canonicalPath(url.pathname));
    let response: Response;
    if (meta && ['GET', 'HEAD'].includes(request.method)) {
        response = await cachedPublicResponse(request, async () => {
            const redirect = slashRedirect(request); if (redirect) return redirect;
            try {
                const data = await publicPageData(env);
                return await pageResponse(request, env, meta, 200, html => renderPublicDocument(html, meta.path, data));
            } catch (error) { console.error('Public rendering failed', error instanceof Error ? error.message : 'unknown'); return unavailableResponse(request, env); }
        }, env);
    } else response = await next();
    if (url.hostname.endsWith('.pages.dev')) {
        response = new Response(response.body, response);
        response.headers.set('X-Robots-Tag', 'noindex, follow');
    }
    return response;
}
