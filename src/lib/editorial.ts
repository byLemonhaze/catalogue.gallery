import type { ArticleRecord } from '../types/article';
export interface EditorialSelection { lead?: string; selected?: string[] }
export const defaultSelections = [
    'claire-silver-taste-is-the-new-skill-v2', 'xcopy-right-click-save',
    'cannot-be-erased-michael-hafftka', 'sin-city-sessions',
];
export function selectEditorial(articles: ArticleRecord[], selection?: EditorialSelection | null) {
    const available = new Map(articles.map(article => [article.id, article]));
    const lead = available.get(selection?.lead || '') || articles[0];
    const used = new Set(lead ? [lead.id] : []);
    const selected: ArticleRecord[] = [];
    // Configured order wins; known evergreen choices and older stories fill missing references.
    for (const id of [...(selection?.selected || []), ...defaultSelections, ...articles.slice().reverse().map(article => article.id)]) {
        const article = available.get(id);
        if (!article || used.has(id) || selected.length === 4) continue;
        used.add(id); selected.push(article);
    }
    const recent = articles.filter(article => !used.has(article.id)).slice(0, 3);
    return { lead, selected, recent };
}
export function previewImage(url: string, width: number) {
    if (!url.startsWith('https://cdn.sanity.io/')) return url;
    const result = new URL(url);
    result.searchParams.set('w', String(width)); result.searchParams.set('auto', 'format'); result.searchParams.set('q', '80');
    return result.toString();
}
