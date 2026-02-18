export type ArticleKind = 'Article' | 'Blog' | 'Interview'

export interface ArticleRecord {
    id: string
    title: string
    author: string
    date: string
    type: ArticleKind | string
    excerpt: string
    content: string
    thumbnailUrl: string
    sortOrder?: number
    source: 'sanity' | 'legacy'
}
