// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../functions/_lib/renderPublic', () => ({ publicPageData: async () => ({}), renderPublicDocument: async (html: string) => html }));
import { onRequestGet as article } from '../../functions/blog/[slug]';
import { onRequestGet as artist } from '../../functions/artist/[slug]';
import { onRequestGet as gallery } from '../../functions/gallery/[slug]';
import { onRequestGet as sitemap } from '../../functions/sitemap.xml';
const shell = '<html><head><title>Old</title></head><body><div id="root"></div></body></html>';
const assets = vi.fn(async (req: Request) => req.method === 'HEAD' ? new Response(null, { status: 404 }) : new Response(shell));
const env = { SANITY_PROJECT_ID: 'test-project', ASSETS: { fetch: assets } };
const profile = { id: 'new-artist', type: 'artist', name: 'New artist', subtitle: 'Generative art', websiteUrl: 'https://example.com', thumbnailUrl: 'https://images.example.com/art.jpg' };
const post = { id: 'new-story', title: 'New story', excerpt: 'A newly published story.', updatedAt: '2026-10-10T12:00:00Z' };
const context = (path: string, slug: string) => ({ request: new Request(`https://catalogue.gallery${path}`), env, params: { slug } });
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('serves newly published profiles with correct metadata and bootstrap without a build', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ result: [profile] })); vi.stubGlobal('fetch', fetchMock);
    const response = await artist(context('/artist/new-artist/', 'new-artist'));
    const html = await response.text();
    expect(response.status).toBe(200); expect(html).toContain('New artist | CATALOGUE');
    expect(html).toContain('https://catalogue.gallery/artist/new-artist/'); expect(html).toContain('id="catalogue-profile"');
    expect(html).toContain('https://images.example.com/art.jpg');
    const query = new URL(fetchMock.mock.calls[0][0]);
    expect(query.searchParams.get('$slug')).toBe('"new-artist"');
    expect(query.searchParams.get('perspective')).toBe('published');
    expect(query.searchParams.get('query')).toContain('drafts.**');
});
it('returns an actual noindex 404 when an article has been removed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: null })));
    const response = await article(context('/blog/removed/', 'removed'));
    expect(response.status).toBe(404); expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    expect(await response.text()).toContain('<h1>Page Not Found');
});
it('returns an actual 404 for unknown artists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: [] })));
    expect((await artist(context('/artist/missing/', 'missing'))).status).toBe(404);
});
it('redirects wrong-type aliases to the correct profile while preserving tracking parameters', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: [profile] })));
    const response = await gallery(context('/gallery/new-artist/?utm_source=x', 'new-artist'));
    expect(response.status).toBe(301); expect(response.headers.get('Location')).toBe('https://catalogue.gallery/artist/new-artist/?utm_source=x');
});
it('distinguishes a CMS failure from a nonexistent article', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const response = await article(context('/blog/new-story/', 'new-story'));
    expect(response.status).toBe(503); expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(response.headers.get('Retry-After')).toBe('60');
});
it('uses a published article and normalizes its slash URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: post })));
    const redirect = await article(context('/blog/new-story', 'new-story')); expect(redirect.status).toBe(301);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: post })));
    const response = await article(context('/blog/new-story/', 'new-story')); const html = await response.text();
    expect(response.status).toBe(200); expect(html).toContain('content="article"'); expect(html).toContain('New story | CATALOGUE');
});
it('does not canonicalize preview pages to the preview host', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: post })));
    const response = await article({ ...context('/blog/new-story/', 'new-story'), request: new Request('https://preview.pages.dev/blog/new-story/') });
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    expect(await response.text()).toContain('href="https://catalogue.gallery/blog/new-story/"');
});
it('refreshes sitemap inventory and excludes the editorial workspace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ result: [profile] })).mockResolvedValueOnce(Response.json({ result: [post] })));
    const response = await sitemap({ env }); const xml = await response.text();
    expect(response.status).toBe(200); expect(response.headers.get('Content-Type')).toContain('application/xml');
    expect(xml).toContain('/artist/new-artist/'); expect(xml).toContain('/blog/new-story/'); expect(xml).not.toContain('content-lab');
});
it('does not silently serve a truncated sitemap when the CMS is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await sitemap({ env })).status).toBe(503);
});
it('reuses public page cache across tracking parameters without caching missing pages or errors', async () => {
    const { cachedPublicResponse } = await import('../../functions/_lib/seoResponse');
    const store = new Map<string, Response>();
    const put = vi.fn(async (key: Request, value: Response) => { store.set(key.url, value); });
    vi.stubGlobal('caches', { default: { match: async (key: Request) => store.get(key.url)?.clone(), put } });
    let revision = 'v1';
    const cacheEnv = { ASSETS: { fetch: async () => new Response(null, { headers: { ETag: revision } }) } };
    const render = vi.fn(async () => new Response('page'));
    const first = await cachedPublicResponse(new Request('https://catalogue.gallery/artist/new/?utm_source=a'), render, cacheEnv);
    expect(await first.text()).toBe('page');
    const next = await cachedPublicResponse(new Request('https://catalogue.gallery/artist/new/?utm_source=b'), render, cacheEnv);
    expect(await next.text()).toBe('page'); expect(render).toHaveBeenCalledTimes(1);
    expect(next.headers.get('Cache-Control')).toContain('max-age=0');
    for (const status of [404, 503]) await cachedPublicResponse(new Request(`https://catalogue.gallery/${status}/`), async () => new Response('error', { status }), cacheEnv);
    expect(put).toHaveBeenCalledTimes(1);
    revision = 'v2';
    await cachedPublicResponse(new Request('https://catalogue.gallery/artist/new/'), render, cacheEnv);
    expect(render).toHaveBeenCalledTimes(2);
});
