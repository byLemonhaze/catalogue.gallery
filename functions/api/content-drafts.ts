/**
 * GET  /api/content-drafts          — list drafts (pending by default)
 * POST /api/content-drafts          — update a draft (status, deploy_target, revision_note)
 */

import { type ContentBankBindings, getDrafts, updateDraftStatus } from './_contentBank';

export const onRequestGet: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as 'pending' | 'published' | 'dismissed' | null;
    const drafts = await getDrafts(env.CONTACTS_DB, status ?? undefined);
    return new Response(JSON.stringify({ drafts }), { headers: { 'content-type': 'application/json' } });
};

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as {
        id: string;
        status?: 'pending' | 'published' | 'dismissed';
        deploy_target?: string;
        revision_note?: string;
        sanity_doc_id?: string;
        published_at?: string;
    };

    if (!body.id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    await updateDraftStatus(env.CONTACTS_DB, body.id, body.status ?? 'pending', {
        deploy_target: body.deploy_target as never,
        revision_note: body.revision_note,
        sanity_doc_id: body.sanity_doc_id,
        published_at: body.published_at,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
