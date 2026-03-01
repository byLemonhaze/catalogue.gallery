import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Each test resets modules so the module-level globalArticleCache starts null.

describe('useArticles', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('maps a valid Sanity post to an ArticleRecord with source: sanity', async () => {
        const mockPost = {
            id: 'my-article',
            title: 'My Article',
            author: 'CATALOGUE',
            displayDate: 'January 1, 2026',
            publishedAt: '2026-01-01T00:00:00Z',
            type: 'Article',
            excerpt: 'A short excerpt.',
            content: '# Body text',
            thumbnailUrl: 'https://cdn.example.com/image.jpg',
            sortOrder: 1,
        }
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockResolvedValue([mockPost]) },
        }))
        vi.doMock('../data/articles', () => ({ articles: [] }))

        const { useArticles } = await import('../hooks/useArticles')
        const { result } = renderHook(() => useArticles())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.articles).toHaveLength(1)
        const article = result.current.articles[0]
        expect(article.id).toBe('my-article')
        expect(article.title).toBe('My Article')
        expect(article.source).toBe('sanity')
        expect(article.thumbnailUrl).toBe('https://cdn.example.com/image.jpg')
    })

    it('filters out Sanity posts that are missing required fields', async () => {
        vi.doMock('../sanity/client', () => ({
            client: {
                fetch: vi.fn().mockResolvedValue([
                    // Missing content — should be dropped
                    { id: 'incomplete', title: 'Incomplete', excerpt: 'Has excerpt', content: '' },
                    // Valid post
                    {
                        id: 'valid',
                        title: 'Valid',
                        excerpt: 'Has excerpt',
                        content: 'Has content',
                    },
                ]),
            },
        }))
        vi.doMock('../data/articles', () => ({ articles: [] }))

        const { useArticles } = await import('../hooks/useArticles')
        const { result } = renderHook(() => useArticles())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.articles).toHaveLength(1)
        expect(result.current.articles[0].id).toBe('valid')
    })

    it('falls back to legacy articles when Sanity fetch throws', async () => {
        vi.doMock('../sanity/client', () => ({
            client: { fetch: vi.fn().mockRejectedValue(new Error('network error')) },
        }))
        vi.doMock('../data/articles', () => ({
            articles: [
                {
                    id: 'legacy-1',
                    title: 'Legacy Article',
                    author: 'CATALOGUE',
                    date: 'Jan 1, 2025',
                    type: 'Article',
                    excerpt: 'legacy excerpt',
                    thumbnail: '/legacy.png',
                    content: 'legacy body',
                },
            ],
        }))

        const { useArticles } = await import('../hooks/useArticles')
        const { result } = renderHook(() => useArticles())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.articles).toHaveLength(1)
        expect(result.current.articles[0].source).toBe('legacy')
        expect(result.current.articles[0].id).toBe('legacy-1')
    })

    it('adds a leading slash to a relative thumbnail path', async () => {
        vi.doMock('../sanity/client', () => ({
            client: {
                fetch: vi.fn().mockResolvedValue([
                    {
                        id: 'article-1',
                        title: 'Article',
                        excerpt: 'excerpt',
                        content: 'body',
                        thumbnailPath: 'images/art.png', // no leading slash
                    },
                ]),
            },
        }))
        vi.doMock('../data/articles', () => ({ articles: [] }))

        const { useArticles } = await import('../hooks/useArticles')
        const { result } = renderHook(() => useArticles())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.articles[0].thumbnailUrl).toBe('/images/art.png')
    })

    it('uses /logo.png as fallback when no thumbnail field is present', async () => {
        vi.doMock('../sanity/client', () => ({
            client: {
                fetch: vi.fn().mockResolvedValue([
                    {
                        id: 'article-2',
                        title: 'Article',
                        excerpt: 'excerpt',
                        content: 'body',
                        // no thumbnail, thumbnailPath, or featuredArtistThumbnailUrl
                    },
                ]),
            },
        }))
        vi.doMock('../data/articles', () => ({ articles: [] }))

        const { useArticles } = await import('../hooks/useArticles')
        const { result } = renderHook(() => useArticles())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.articles[0].thumbnailUrl).toBe('/logo.png')
    })
})
