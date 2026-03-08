/**
 * GET  /api/content-drafts          — list drafts (pending by default)
 * POST /api/content-drafts          — create or update a draft
 */

import {
    type ContentBankBindings,
    createDraft,
    deleteDraft,
    getDrafts,
    pruneDrafts,
    updateDraftStatus,
} from './_contentBank';

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
        operation?: 'create';
        id: string;
        type?: 'article' | 'blog' | 'wildcard';
        title?: string;
        excerpt?: string;
        content?: string;
        tags?: string[];
        source_artist_id?: string | null;
        source_artist_name?: string | null;
        status?: 'pending' | 'published' | 'dismissed';
        deploy_target?: string;
        revision_note?: string;
        sanity_doc_id?: string;
        published_at?: string;
        generated_at?: string;
    };

    if (body.operation === 'create') {
        if (!body.type || !body.title || !body.excerpt || !body.content) {
            return new Response(JSON.stringify({ error: 'Missing draft fields' }), { status: 400 });
        }

        const draft = await createDraft(env.CONTACTS_DB, {
            id: body.id || undefined,
            type: body.type,
            title: body.title,
            excerpt: body.excerpt,
            content: body.content,
            tags: Array.isArray(body.tags) ? body.tags : [],
            source_artist_id: body.source_artist_id ?? null,
            source_artist_name: body.source_artist_name ?? null,
            status: body.status ?? 'pending',
            generated_at: body.generated_at || new Date().toISOString(),
        });
        await pruneDrafts(env.CONTACTS_DB, 100);

        return new Response(JSON.stringify({ ok: true, draft }), { headers: { 'content-type': 'application/json' } });
    }

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

export const onRequestDelete: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    await deleteDraft(env.CONTACTS_DB, id);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
