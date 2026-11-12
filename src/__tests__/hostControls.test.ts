// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('../../functions/_lib/renderPublic', () => ({ publicPageData: async () => ({}), renderPublicDocument: async (html: string) => html }));
import { onRequest } from '../../functions/_middleware';
const env = { ASSETS: { fetch: async () => new Response('<html><head></head><body><div id="root"></div></body></html>') } };
it('permanently redirects old article and about URLs without losing queries', async () => {
    for (const [before,after] of [['/blog','/stories/'],['/blog/story/?ref=x','/stories/story/?ref=x'],['/info/','/about/']]) {
        const response = await onRequest({request:new Request(`https://catalogue.gallery${before}`),env,next:async()=>new Response('unexpected')});
        expect(response.status).toBe(301);
        expect(response.headers.get('Location')).toBe(`https://catalogue.gallery${after}`);
    }
});
it('redirects production aliases with the entire path and query, without redirecting previews', async () => {
    for (const host of ['www.catalogue.gallery', 'artfinder.pages.dev', 'production.artfinder.pages.dev']) {
        const response = await onRequest({ request: new Request(`https://${host}/stories/story/?utm_source=test`), env, next: async () => new Response('page') });
        expect(response.status).toBe(301); expect(response.headers.get('Location')).toBe('https://catalogue.gallery/stories/story/?utm_source=test');
    }
});
it('noindexes every preview response including static files and errors', async () => {
    for (const path of ['/about/', '/assets/example.js', '/missing', '/api/artists']) {
        const response = await onRequest({ request: new Request(`https://abc.artfinder.pages.dev${path}`), env, next: async () => new Response('data', { status: 404 }) });
        expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    }
});
it('does not expose the internal app shell as another indexable page', async () => {
    const response = await onRequest({ request: new Request('https://catalogue.gallery/app-shell.html'), env, next: async () => new Response('shell') });
    expect(response.status).toBe(404); expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
});
it('keeps file paths intact when redirecting legacy hosts', async () => {
    const response = await onRequest({request:new Request('https://www.catalogue.gallery/assets/site.js?v=1'),env,next:async()=>new Response('unexpected')});
    expect(response.headers.get('Location')).toBe('https://catalogue.gallery/assets/site.js?v=1');
});

it('redirects legacy article handlers to the identical Stories slug', async () => {
    const {onRequestGet} = await import('../../functions/blog/[slug]');
    const response = onRequestGet({request:new Request('https://catalogue.gallery/blog/experimental-television-center-owego-paik-abe/?ref=x')});
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://catalogue.gallery/stories/experimental-television-center-owego-paik-abe/?ref=x');
});
