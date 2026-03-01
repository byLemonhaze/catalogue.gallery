import { useEffect, useState } from 'react'
import { client } from '../sanity/client'
import { articles as legacyArticles } from '../data/articles'
import type { ArticleRecord } from '../types/article'

type SanityPost = {
    id?: string
    title?: string
    author?: string
    displayDate?: string
    publishedAt?: string
    type?: string
    excerpt?: string
    content?: string
    featuredArtistThumbnailUrl?: string
    thumbnailUrl?: string
    thumbnailPath?: string
    sortOrder?: number
}

// Local article shape from data/articles.ts
type LegacyArticle = {
    id: string
    title: string
    author?: string
    date?: string
    type?: string
    excerpt?: string
    content?: string
    thumbnail?: string
}

let articleCache: ArticleRecord[] | null = null

function isAbsoluteUrl(value: string) {
    return /^https?:\/\//i.test(value)
}

function normalizeImageUrl(value: string | undefined) {
    if (!value) return '/logo.png'
    if (isAbsoluteUrl(value)) return value
    return value.startsWith('/') ? value : `/${value}`
}

function formatDateFromIso(iso: string | undefined) {
    if (!iso) return ''
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

function mapLegacyArticle(article: LegacyArticle, index: number): ArticleRecord {
    return {
        id: article.id,
        title: article.title,
        author: article.author || 'CATALOGUE',
        date: article.date || '',
        type: article.type || 'Article',
        excerpt: article.excerpt || '',
        content: article.content || '',
        thumbnailUrl: normalizeImageUrl(article.thumbnail),
        sortOrder: index,
        source: 'legacy',
    }
}

function mapSanityArticle(post: SanityPost): ArticleRecord | null {
    const id = post.id?.trim()
    const title = post.title?.trim()
    const excerpt = post.excerpt?.trim()
    const content = post.content || ''
    if (!id || !title || !excerpt || !content) return null

    return {
        id,
        title,
        author: post.author?.trim() || 'CATALOGUE',
        date: post.displayDate?.trim() || formatDateFromIso(post.publishedAt) || '',
        type: post.type?.trim() || 'Article',
        excerpt,
        content,
        thumbnailUrl: normalizeImageUrl(post.featuredArtistThumbnailUrl || post.thumbnailUrl || post.thumbnailPath),
        sortOrder: typeof post.sortOrder === 'number' ? post.sortOrder : undefined,
        source: 'sanity',
    }
}

async function fetchSanityArticles(): Promise<ArticleRecord[]> {
    const query = `*[_type == "post" && defined(slug.current)]
        | order(coalesce(sortOrder, 999999) asc, coalesce(publishedAt, _createdAt) desc) {
            "id": slug.current,
            title,
            author,
            displayDate,
            publishedAt,
            type,
            excerpt,
            content,
            sortOrder,
            "featuredArtistThumbnailUrl": featuredArtist->thumbnail.asset->url,
            thumbnailPath,
            "thumbnailUrl": thumbnail.asset->url
        }`

    const posts = await client.fetch<SanityPost[]>(query)
    return posts.map(mapSanityArticle).filter((item): item is ArticleRecord => item !== null)
}

export function useArticles() {
    const [articles, setArticles] = useState<ArticleRecord[]>(articleCache || [])
    const [loading, setLoading] = useState(!articleCache)

    useEffect(() => {
        if (articleCache) return

        let isCancelled = false

        const load = async () => {
            try {
                const sanityArticles = await fetchSanityArticles()
                const resolved = sanityArticles.length > 0
                    ? sanityArticles
                    : legacyArticles.map(mapLegacyArticle)

                if (!isCancelled) {
                    articleCache = resolved
                    setArticles(resolved)
                }
            } catch (error) {
                console.error('Failed to fetch Sanity articles, using local fallback:', error)
                const fallback = legacyArticles.map(mapLegacyArticle)
                if (!isCancelled) {
                    articleCache = fallback
                    setArticles(fallback)
                }
            } finally {
                if (!isCancelled) setLoading(false)
            }
        }

        load()

        return () => {
            isCancelled = true
        }
    }, [])

    return { articles, loading }
}
