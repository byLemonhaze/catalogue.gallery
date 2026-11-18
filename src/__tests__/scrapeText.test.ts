import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWebsiteHtml, stripHtml } from '../../functions/api/_scrapeText';

afterEach(() => vi.unstubAllGlobals());

describe('research text extraction', () => {
    it('excludes scripts with noncanonical closing tags and nested navigation', () => {
        expect(stripHtml('<p>Artist</p><SCRIPT>ignore me</script ><nav><b>menu</b></nav><p>Biography</p>')).toBe('Artist Biography');
    });
    it('decodes entities once and never reinterprets decoded text as markup', () => {
        expect(stripHtml('<p>&amp;lt; &lt;b&gt; &quot;art&quot; &nbsp; ©</p>')).toBe('&lt; <b> "art" ©');
    });
    it('preserves text around void elements and omitted sections', () => {
        expect(stripHtml('Before<br><style>x</style><p>After <em>art</em></p>')).toBe('Before After art');
    });
});

describe('bounded public website fetches', () => {
    it('rejects a redirect to a private address before fetching it', async () => {
        const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/' } }));
        vi.stubGlobal('fetch', fetcher);
        await expect(fetchWebsiteHtml('https://artist.com')).rejects.toThrow();
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
    it('stops oversized bodies even without a Content-Length header', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('a'.repeat(1_000_001), { headers: { 'content-type': 'text/html' } })));
        expect(await fetchWebsiteHtml('https://artist.com')).toBeNull();
    });
    it('accepts public HTTPS redirects and text HTML', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/about' } }))
            .mockResolvedValueOnce(new Response('<p>Artist</p>', { headers: { 'content-type': 'text/html; charset=utf-8' } }));
        vi.stubGlobal('fetch', fetcher);
        expect(await fetchWebsiteHtml('https://artist.com')).toBe('<p>Artist</p>');
        expect(fetcher.mock.calls[1][0]).toBe('https://artist.com/about');
    });
});
