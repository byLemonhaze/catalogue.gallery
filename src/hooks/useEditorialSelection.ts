import { PublicPageContext } from '../lib/publicPageData';
import { useContext, useEffect, useState } from 'react';
import { client } from '../sanity/client';
import type { EditorialSelection } from '../lib/editorial';
let cached: EditorialSelection | null | undefined;
let pending: Promise<EditorialSelection | null> | undefined;
export function useEditorialSelection() {
    const initial = useContext(PublicPageContext);
    const [selection, setSelection] = useState(initial ? initial.editorial : cached);
    useEffect(() => {
        let cancelled = false;
        if (initial || cached !== undefined) return;
        pending ??= client.fetch<EditorialSelection | null>('*[_type == "homepageEditorial" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{"lead": lead->slug.current, "selected": selected[]->slug.current}')
            .then(value => { cached = value; return value; }).catch(() => null).finally(() => { pending = undefined; });
        void pending.then(value => { if (!cancelled) setSelection(value); });
        return () => { cancelled = true; };
    }, [initial]);
    return selection;
}
