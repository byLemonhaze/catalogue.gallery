// @vitest-environment node
import { describe, expect, it, vi, afterEach } from 'vitest';
import { checkEmbedding, inspectEmbeddingHeaders } from '../../functions/api/_embedCheck';
import { onRequestGet } from '../../functions/api/check-embed';
import { normalizeWebsiteUrl } from '../../shared/submission';

const inspect = (headers: Record<string, string>, url = 'https://artist.com') => inspectEmbeddingHeaders(new Headers(headers), url).status;
afterEach(() => vi.unstubAllGlobals());

describe('embedding permissions', () => {
    it.each([
        [{}, 'compatible'],
        [{ 'x-frame-options': 'DENY' }, 'blocked'],
        [{ 'x-frame-options': 'sameorigin' }, 'blocked'],
        [{ 'content-security-policy': "default-src 'none'" }, 'compatible'],
        [{ 'content-security-policy': "frame-ancestors 'none'" }, 'blocked'],
        [{ 'content-security-policy': "frame-ancestors 'self'" }, 'blocked'],
        [{ 'content-security-policy': 'frame-ancestors https://catalogue.gallery' }, 'compatible'],
        [{ 'content-security-policy': 'frame-ancestors https://catalogue.gallery.evil.com' }, 'blocked'],
        [{ 'content-security-policy': 'frame-ancestors https://*.catalogue.gallery' }, 'blocked'],
        [{ 'content-security-policy': 'frame-ancestors https://*.gallery' }, 'compatible'],
        [{ 'content-security-policy': 'frame-ancestors https://catalogue.gallery:1234' }, 'blocked'],
        [{ 'content-security-policy': 'frame-ancestors https://catalogue.gallery:443/' }, 'compatible'],
        [{ 'content-security-policy': 'frame-ancestors https://catalogue.gallery/specific-page' }, 'blocked'],
        [{ 'content-security-policy': 'frame-ancestors *', 'x-frame-options': 'DENY' }, 'compatible'],
        [{ 'content-security-policy-report-only': 'frame-ancestors *', 'x-frame-options': 'DENY' }, 'blocked'],
        [{ 'content-security-policy': "frame-ancestors *, frame-ancestors 'none'" }, 'blocked'],
        [{ 'content-security-policy': "frame-ancestors 'none'; frame-ancestors *" }, 'blocked'],
        [{ 'content-security-policy': 'frame-ancestors' }, 'blocked'],
    ])('evaluates %j as %s', (headers, status) => {
        expect(inspect(headers)).toBe(status);
    });
    it('evaluates self against the final website origin', () => {
        expect(inspect({ 'content-security-policy': "frame-ancestors 'self'" }, 'https://catalogue.gallery')).toBe('compatible');
    });
});

describe('website checks', () => {
    it.each(['http://artist.com', 'https://localhost', 'https://127.0.0.1', 'https://0x7f000001', 'https://[::1]', 'https://artist.local', 'https://artist.com:8080', 'https://user:pass@artist.com', 'javascript:alert(1)'])('rejects %s', url => {
        expect(() => normalizeWebsiteUrl(url)).toThrow();
    });
    it('preserves meaningful trailing slashes and query values', () => {
        expect(normalizeWebsiteUrl('https://artist.com/portfolio/')).toBe('https://artist.com/portfolio/');
        expect(normalizeWebsiteUrl('https://artist.com/?next=/')).toBe('https://artist.com/?next=/');
    });
    it('times out without reporting a permissions block', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new Error('timeout')));
        })));
        try {
            const pending = checkEmbedding('https://artist.com');
            await vi.advanceTimersByTimeAsync(8000);
            expect((await pending).status).toBe('unknown');
        } finally {
            vi.useRealTimers();
        }
    });
    it('checks the final GET response after redirects', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/portfolio' } }))
            .mockResolvedValueOnce(new Response('<html/>', { headers: { 'content-type': 'text/html', 'x-frame-options': 'DENY' } }));
        vi.stubGlobal('fetch', fetchMock);
        expect((await checkEmbedding('https://artist.com')).status).toBe('blocked');
        expect(fetchMock.mock.calls[1][0]).toBe('https://artist.com/portfolio');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
    });
    it('does not fetch a private redirect', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://127.0.0.1' } }));
        vi.stubGlobal('fetch', fetchMock);
        expect((await checkEmbedding('https://artist.com')).status).toBe('unknown');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it('blocks HTTPS downgrades', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'http://artist.com' } })));
        expect((await checkEmbedding('https://artist.com')).status).toBe('blocked');
    });
    it('bounds redirect loops', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: '/loop' } }));
        vi.stubGlobal('fetch', fetchMock);
        expect((await checkEmbedding('https://artist.com')).status).toBe('unknown');
        expect(fetchMock).toHaveBeenCalledTimes(5);
    });
    it.each([403, 429, 500])('does not call HTTP %s compatible', async status => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
        expect((await checkEmbedding('https://artist.com')).status).toBe('unknown');
    });
    it('handles network errors and non-HTML responses', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        expect((await checkEmbedding('https://artist.com')).status).toBe('unknown');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json' } })));
        expect((await checkEmbedding('https://artist.com')).status).toBe('unknown');
    });
    it('rejects invalid endpoint input before making requests', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const response = await onRequestGet({ request: new Request('https://catalogue.gallery/api/check-embed?url=bad') });
        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
