import { createContext } from 'react';
import type { Artist } from '../hooks/useArtists';
import type { ArticleRecord } from '../types/article';
import type { EditorialSelection } from './editorial';
export interface PublicPageData { artists: Artist[]; articles: ArticleRecord[]; editorial: EditorialSelection | null }
export const PublicPageContext = createContext<PublicPageData | null>(null);
export function readPublicPageData(): PublicPageData | null {
    if (typeof document === 'undefined') return null;
    const node = document.getElementById('catalogue-public-data');
    if (!node?.textContent) return null;
    try {
        const data = JSON.parse(node.textContent) as PublicPageData;
        return Array.isArray(data.artists) && Array.isArray(data.articles) ? data : null;
    } catch { return null; }
}
