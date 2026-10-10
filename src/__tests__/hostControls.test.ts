// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('../../functions/_lib/renderPublic', () => ({ publicPageData: async () => ({}), renderPublicDocument: async (html: string) => html }));
import { onRequest } from '../../functions/_middleware';
const env = { ASSETS: { fetch: async () => new Response('<html><head></head><body><div id="root"></div></body></html>') } };
it('redirects production aliases with the entire path and query, without redirecting previews', async () => {
    for (const host of ['www.catalogue.gallery', 'artfinder.pages.dev', 'production.artfinder.pages.dev']) {
        const response = await onRequest({ request: new Request(`https://${host}/blog/story/?utm_source=test`), env, next: async () => new Response('page') });
        expect(response.status).toBe(301); expect(response.headers.get('Location')).toBe('https://catalogue.gallery/blog/story/?utm_source=test');
    }
});
it('noindexes every preview response including static files and errors', async () => {
    for (const path of ['/info/', '/assets/example.js', '/missing', '/api/artists']) {
        const response = await onRequest({ request: new Request(`https://abc.artfinder.pages.dev${path}`), env, next: async () => new Response('data', { status: 404 }) });
        expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    }
});
it('does not expose the internal app shell as another indexable page', async () => {
    const response = await onRequest({ request: new Request('https://catalogue.gallery/app-shell.html'), env, next: async () => new Response('shell') });
    expect(response.status).toBe(404); expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
});
