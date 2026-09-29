import { describe, it, expect } from 'vitest';
import { parseProfileBootstrap } from '../lib/profileBootstrap';
const valid = { id: 'artist', type: 'artist', name: 'Artist', websiteUrl: 'https://example.com', desktopExitPosition: 'top-left' };
describe('generated profile bootstrap', () => {
    it('allows an HTTPS profile matching both route and slug', () => {
        expect(parseProfileBootstrap(valid, 'artist', 'artist')?.websiteUrl).toBe(valid.websiteUrl);
    });
    it('rejects stale route data and unsafe URLs', () => {
        expect(parseProfileBootstrap(valid, 'other', 'artist')).toBeNull();
        expect(parseProfileBootstrap(valid, 'artist', 'gallery')).toBeNull();
        expect(parseProfileBootstrap({ ...valid, websiteUrl: 'javascript:alert(1)' }, 'artist', 'artist')).toBeNull();
        expect(parseProfileBootstrap(null, 'artist', 'artist')).toBeNull();
    });
});
