import { useContext, useEffect, useState } from 'react';
import { PublicPageContext } from '../lib/publicPageData';
import { client } from '../sanity/client';
import { dispatchQuery, mergeDispatches, type DispatchPost } from '../lib/dispatch';
export function useDispatches() {
    const initial = useContext(PublicPageContext);
    const [posts, setPosts] = useState<DispatchPost[]>(() => initial?.dispatches ?? (initial?.dispatch ? [initial.dispatch] : mergeDispatches()));
    useEffect(() => {
        if (initial) return;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        void client.fetch<DispatchPost[]>(dispatchQuery, {}, {signal:controller.signal}).then(value => { if (!controller.signal.aborted) setPosts(mergeDispatches(Array.isArray(value) ? value : [])); }).catch(() => {}).finally(() => clearTimeout(timer));
        return () => { controller.abort(); clearTimeout(timer); };
    }, [initial]);
    return posts;
}
