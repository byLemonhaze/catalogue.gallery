// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/content-scrape';

function scrape(body: unknown, password = 'test-password', configuredPassword = 'test-password') {
    return onRequestPost({
        request: new Request('https://catalogue.gallery/api/content-scrape', {
            method: 'POST', headers: { 'x-content-lab-password': password }, body: JSON.stringify(body),
        }),
        env: { CONTENT_LAB_PASSWORD: configuredPassword, SANITY_WRITE_TOKEN: 'test-token' },
    });
}
afterEach(() => vi.unstubAllGlobals());

it('fails closed when the configured password is empty', async () => {
    expect((await scrape({ artistId: 'artist-id' }, '', '')).status).toBe(401);
});

it.each([null, {}, { artistId: 12 }, { artistId: 'id" || true || "' }])('rejects malformed IDs before querying Sanity: %j', async body => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect((await scrape(body)).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
});

it('passes a valid ID as a GROQ parameter, not query source', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ result: null }));
    vi.stubGlobal('fetch', fetcher);
    expect((await scrape({ artistId: 'artist-id' })).status).toBe(404);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get('$artistId')).toBe('"artist-id"');
    expect(url.searchParams.get('query')).toContain('_id == $artistId');
    expect(url.searchParams.get('query')).not.toContain('artist-id');
});
