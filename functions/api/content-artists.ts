/**
 * GET /api/content-artists
 * Returns approved artists + galleries from Sanity for the Content Lab artist picker.
 * Protected by CONTENT_LAB_PASSWORD.
 */

import { type ContentBankBindings } from './_contentBank';

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

export const onRequestGet: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const query = encodeURIComponent(
            `*[_type in ["artist","gallery"] && status == "published"]{_id, name, subtitle, _type} | order(name asc)`
        );
        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`[content-artists] Sanity fetch failed: ${res.status}`);
            return new Response(JSON.stringify({ artists: [] }), { headers: { 'content-type': 'application/json' } });
        }
        const data = await res.json() as { result: Array<{ _id: string; name: string; subtitle: string; _type: string }> };
        return new Response(JSON.stringify({ artists: data.result || [] }), {
            headers: { 'content-type': 'application/json' },
        });
    } catch (err) {
        console.error('[content-artists] Error:', err);
        return new Response(JSON.stringify({ artists: [] }), { headers: { 'content-type': 'application/json' } });
    }
};
