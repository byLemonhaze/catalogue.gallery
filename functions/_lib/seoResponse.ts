import { applyPageMeta, missingMeta, escapeHtml, type PageMeta } from '../../src/lib/seo';
import type { PublicEnv } from './publicContent';
export interface PageEnv extends PublicEnv { ASSETS: { fetch(request: Request): Promise<Response> } }
export async function pageResponse(request: Request, env: PageEnv, meta: PageMeta, status = 200, transform?: (html: string) => string) {
    const shell = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    if (!shell.ok) return new Response('Page temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
    let html = applyPageMeta(await shell.text(), meta);
    if (transform) html = transform(html);
    if (status !== 200) html = html.replace('<div id="root"></div>', `<div id="root"><main><h1>${escapeHtml(meta.title)}</h1><p>${escapeHtml(meta.description)}</p><a href="/artists/">Explore the directory</a></main></div>`);
    const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=0, s-maxage=300, must-revalidate' : 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' });
    const hostname = new URL(request.url).hostname;
    if (meta.noindex || hostname.endsWith('.pages.dev')) headers.set('X-Robots-Tag', 'noindex, follow');
    if (status === 503) headers.set('Retry-After', '60');
    return new Response(request.method === 'HEAD' ? null : html, { status, headers });
}
export function missingResponse(request: Request, env: PageEnv) { return pageResponse(request, env, missingMeta(new URL(request.url).pathname), 404); }
export function unavailableResponse(request: Request, env: PageEnv) {
    return pageResponse(request, env, { path: new URL(request.url).pathname, title: 'Temporarily Unavailable | CATALOGUE', description: 'Please try again shortly.' }, 503);
}
export function slashRedirect(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) return null;
    url.pathname += '/';
    return Response.redirect(url.href, 301);
}

// Only public successful documents are cached. Missing records and CMS failures stay uncached.
export async function cachedPublicResponse(request: Request, render: () => Promise<Response>, env: PageEnv) {
    const cache = (globalThis.caches as (CacheStorage & { default?: Cache }) | undefined)?.default;
    if (!cache || request.method !== 'GET') return render();
    // Key by the deployed shell so a release never reuses HTML pointing at old JS assets.
    let revision: string | null = null;
    try { revision = (await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), { method: 'HEAD' }))).headers.get('ETag'); }
    catch { return render(); }
    if (!revision) return render();
    const url = new URL(request.url); url.search = `?__catalogue_seo=${encodeURIComponent(revision)}`;
    const key = new Request(url, { method: 'GET' });
    try {
        const cached = await cache.match(key);
        if (cached) {
            const headers = new Headers(cached.headers);
            headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');
            return new Response(cached.body, { status: cached.status, headers });
        }
    } catch { /* Cache availability must not determine page availability. */ }
    const response = await render();
    if (response.status === 200) {
        const headers = new Headers(response.headers); headers.set('Cache-Control', 'public, max-age=300');
        try { await cache.put(key, new Response(response.clone().body, { status: 200, headers })); }
        catch { /* Keep the valid origin response. */ }
    }
    return response;
}
