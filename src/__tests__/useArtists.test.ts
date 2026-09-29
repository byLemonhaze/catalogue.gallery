import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Each test uses vi.resetModules() + vi.doMock() + dynamic import so the
// module-level globalCache starts as null for every test.

describe('useArtists', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('starts in loading state before data arrives', async () => {
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockReturnValue(new Promise(() => {})) },
        }))
        const { useArtists } = await import('../hooks/useArtists')
        const { result } = renderHook(() => useArtists())
        expect(result.current.loading).toBe(true)
        expect(result.current.artists).toEqual([])
    })

    it('resolves artists from Sanity and marks isSanity: true', async () => {
        const mockArtists = [
            {
                id: 'xcopy',
                name: 'XCOPY',
                subtitle: 'Digital art legend',
                websiteUrl: 'https://xcopy.art',
                thumbnail: null,
                type: 'artist',
                desktopExitPosition: 'top-right',
                mobileExitPosition: 'bottom-center',
            },
        ]
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockResolvedValue(mockArtists) },
        }))
        const { useArtists } = await import('../hooks/useArtists')
        const { result } = renderHook(() => useArtists())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.artists).toHaveLength(1)
        expect(result.current.artists[0].name).toBe('XCOPY')
        expect(result.current.artists[0].isSanity).toBe(true)
        expect(result.current.error).toBeNull()
    })

    it('sets error and returns empty array when Sanity fetch rejects', async () => {
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockRejectedValue(new Error('Sanity is down')) },
        }))
        const { useArtists } = await import('../hooks/useArtists')
        const { result } = renderHook(() => useArtists())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.artists).toEqual([])
        expect(result.current.error).toBeTruthy()
    })

    it('sets an error message when Sanity returns an empty array', async () => {
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockResolvedValue([]) },
        }))
        const { useArtists } = await import('../hooks/useArtists')
        const { result } = renderHook(() => useArtists())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.artists).toEqual([])
        expect(result.current.error).toBe('No artists were returned from Sanity.')
    })

    it('returns an error when Sanity returns a non-array', async () => {
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockResolvedValue({ surprise: 'object' }) },
        }))
        const { useArtists } = await import('../hooks/useArtists')
        const { result } = renderHook(() => useArtists())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.error).toBeTruthy()
    })
})

describe('shared artist request lifecycle', () => {
    beforeEach(() => vi.resetModules());
    it('shares the in-flight request across subscribers and survives one unmount', async () => {
        let resolve!: (data: unknown[]) => void;
        const fetch = vi.fn(() => new Promise<unknown[]>(done => { resolve = done; }));
        vi.doMock('../sanity/client', () => ({ client: { fetch } }));
        const { useArtists } = await import('../hooks/useArtists');
        const first = renderHook(() => useArtists()); const second = renderHook(() => useArtists());
        expect(fetch).toHaveBeenCalledTimes(1); first.unmount();
        resolve([{ id: 'artist', name: 'Artist', websiteUrl: 'https://example.com' }]);
        await waitFor(() => expect(second.result.current.loading).toBe(false));
        expect(second.result.current.artists).toHaveLength(1);
    });
    it('does not fetch when disabled and can load when enabled later', async () => {
        const fetch = vi.fn().mockResolvedValue([]);
        vi.doMock('../sanity/client', () => ({ client: { fetch } }));
        const { useArtists } = await import('../hooks/useArtists');
        const hook = renderHook(({ enabled }) => useArtists(enabled), { initialProps: { enabled: false } });
        expect(fetch).not.toHaveBeenCalled(); expect(hook.result.current.loading).toBe(false);
        hook.rerender({ enabled: true });
        await waitFor(() => expect(hook.result.current.loading).toBe(false)); expect(fetch).toHaveBeenCalledTimes(1);
    });
    it('allows a later subscriber to retry a failed request', async () => {
        const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ id: 'back', name: 'Back' }]);
        vi.doMock('../sanity/client', () => ({ client: { fetch } }));
        const { useArtists } = await import('../hooks/useArtists');
        const first = renderHook(() => useArtists()); await waitFor(() => expect(first.result.current.error).toBeTruthy()); first.unmount();
        const second = renderHook(() => useArtists()); await waitFor(() => expect(second.result.current.artists).toHaveLength(1));
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
