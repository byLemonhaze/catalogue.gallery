/**
 * POST /api/content-upload-image
 * Uploads a raw image file to Sanity's media library.
 * Returns the asset _id (usable as _ref in a Sanity image object).
 *
 * Expects: Content-Type: image/*, body = raw image bytes
 * Requires: SANITY_WRITE_TOKEN, CONTENT_LAB_PASSWORD
 */

import { type ContentBankBindings } from './_contentBank';

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!env.SANITY_WRITE_TOKEN) {
        return new Response(JSON.stringify({ error: 'SANITY_WRITE_TOKEN not set' }), { status: 500 });
    }

    const contentType = request.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
        return new Response(JSON.stringify({ error: 'Only image/* content types accepted' }), { status: 400 });
    }

    const fileBuffer = await request.arrayBuffer();
    if (!fileBuffer.byteLength) {
        return new Response(JSON.stringify({ error: 'Empty file body' }), { status: 400 });
    }

    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${SANITY_DATASET}`;
    const sanityRes = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SANITY_WRITE_TOKEN}`,
            'Content-Type': contentType,
        },
        body: fileBuffer,
    });

    if (!sanityRes.ok) {
        const errText = await sanityRes.text().catch(() => 'unreadable');
        console.error(`[content-upload-image] Sanity upload failed: ${sanityRes.status} — ${errText}`);
        return new Response(JSON.stringify({ error: `Sanity upload failed (${sanityRes.status})` }), { status: 502 });
    }

    const data = await sanityRes.json() as { document: { _id: string } };
    const assetId = data.document._id;
    console.log(`[content-upload-image] Uploaded: ${assetId}`);

    return new Response(JSON.stringify({ ok: true, assetId }), {
        headers: { 'content-type': 'application/json' },
    });
};
