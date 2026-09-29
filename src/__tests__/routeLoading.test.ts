import { it, expect } from 'vitest';
import { mayReload, isChunkError } from '../lib/routeLoading';
it('bounds stale chunk reloads and distinguishes ordinary application errors', () => {
    expect(mayReload(null, 1000)).toBe(true);
    expect(mayReload('1000', 2000)).toBe(false);
    expect(mayReload('1000', 62000)).toBe(true);
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: /assets/old.js'))).toBe(true);
    expect(isChunkError(new Error('Invalid data'))).toBe(false);
});
