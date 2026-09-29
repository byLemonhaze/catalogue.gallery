import { useEffect, useState } from 'react';
import { client } from '../sanity/client';
import type { ArticleRecord } from '../types/article';
const bodies = new Map<string, string>();
const requests = new Map<string, Promise<string>>();
export function useArticleBody(article: ArticleRecord | undefined) {
    const id = article?.id;
    const [result, setResult] = useState<{ id?: string; content?: string; error?: boolean }>({});
    useEffect(() => {
        if (!id || article?.content || bodies.has(id)) return;
        let cancelled = false;
        if (!requests.has(id)) requests.set(id, client.fetch<string | null>(
            '*[_type == "post" && slug.current == $id && !(_id in path("drafts.**"))][0].content', { id },
        ).then(content => { if (!content) throw new Error('Article unavailable'); bodies.set(id, content); return content; }).finally(() => requests.delete(id)));
        void requests.get(id)!.then(content => { if (!cancelled) setResult({ id, content }); })
            .catch(() => { if (!cancelled) setResult({ id, error: true }); });
        return () => { cancelled = true; };
    }, [id, article?.content]);
    const content = article?.content || (id ? bodies.get(id) : '') || (result.id === id ? result.content : '') || '';
    const error = result.id === id && result.error;
    return { content, loading: Boolean(id && !content && !error), error };
}
