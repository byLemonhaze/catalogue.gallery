import { useEffect, useState } from 'react';
import { client } from '../sanity/client';
import type { EditorialSelection } from '../lib/editorial';
let cached: EditorialSelection | null | undefined;
let pending: Promise<EditorialSelection | null> | undefined;
export function useEditorialSelection() {
    const [selection, setSelection] = useState(cached);
    useEffect(() => {
        let cancelled = false;
        if (cached !== undefined) return;
        pending ??= client.fetch<EditorialSelection | null>('*[_type == "homepageEditorial" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{"lead": lead->slug.current, "selected": selected[]->slug.current}')
            .then(value => { cached = value; return value; }).catch(() => null).finally(() => { pending = undefined; });
        void pending.then(value => { if (!cancelled) setSelection(value); });
        return () => { cancelled = true; };
    }, []);
    return selection;
}
