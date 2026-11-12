import { afterEach, expect, it, vi } from 'vitest';
import { onRequestGet } from '../../functions/media/artist';
afterEach(() => vi.unstubAllGlobals());
const requestImage = (query: string) => onRequestGet({ request: new Request(`https://catalogue.gallery/media/artist?${query}`) } as Parameters<typeof onRequestGet>[0]);
it('rejects arbitrary upstream URLs and traversal without making an external request', async () => {
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
    expect((await requestImage('asset=https://evil.example/image.png')).status).toBe(400);
    expect((await requestImage('asset=../../secret')).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
});
it.each(['450', '900', '1200'])('delivers a bounded %s-pixel public Sanity image without forwarding credentials', async (width) => {
    const fetcher=vi.fn().mockResolvedValue(new Response('pixels',{headers:{'Content-Type':'image/webp'}}));vi.stubGlobal('fetch',fetcher);
    const response=await requestImage(`asset=abcdef-800x600.png&w=${width}`);
    expect(fetcher).toHaveBeenCalledWith(`https://cdn.sanity.io/images/ebj9kqfo/production/abcdef-800x600.png?w=${width}&q=80&auto=format`);
    expect(response.headers.get('Content-Type')).toBe('image/webp');
    expect(await response.text()).toBe('pixels');
});
