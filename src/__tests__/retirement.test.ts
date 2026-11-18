import { afterEach, expect, it, vi } from 'vitest';
import { retiredRouteResponse } from '../../functions/_lib/retiredRoutes';
import { clearRetiredCredentials } from '../lib/retiredCredentials';

afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });

it.each(['/content-lab', '/content-lab/', '/content-lab/admin', '/content-lab/anything', '/api/content-generate', '/api/content-drafts', '/api/content-publish', '/api/content-scrape', '/api/content-upload-image', '/api/content-artists'])('permanently removes %s for every method', async path => {
    for (const method of ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD']) {
        const response = retiredRouteResponse(new Request('https://catalogue.gallery' + path, { method }));
        expect(response?.status).toBe(410);
        expect(response?.headers.get('x-robots-tag')).toContain('noindex');
        if (method === 'HEAD') expect(await response?.text()).toBe('');
    }
});

it.each(['/stories/', '/dispatch/', '/submit/', '/api/submit', '/api/artists', '/api/webhook'])('preserves the active route %s', path => {
    expect(retiredRouteResponse(new Request('https://catalogue.gallery' + path))).toBeNull();
});

it('removes the obsolete stored key without reading it or touching other preferences', () => {
    sessionStorage.setItem('content-lab:xai-api-key', 'old-test-value');
    sessionStorage.setItem('preference', 'keep');
    const read = vi.spyOn(Storage.prototype, 'getItem');
    clearRetiredCredentials();
    expect(read).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('content-lab:xai-api-key')).toBeNull();
    expect(sessionStorage.getItem('preference')).toBe('keep');
});
