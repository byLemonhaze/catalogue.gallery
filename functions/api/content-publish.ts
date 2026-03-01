/**
 * POST /api/content-publish
 * Publishes a draft to Sanity as a post document (status: draft).
 * The user then reviews and publishes in Sanity Studio when ready.
 */

import { type ContentBankBindings, updateDraftStatus } from './_contentBank';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as {
        id: string;
        title: string;
        excerpt: string;
        content: string;
        tags: string[];
        deploy_target: string;
    };

    if (!body.id || !body.deploy_target) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const slug = slugify(body.title);
    const docId = `post-contentbank-${body.id}`;

    // Map deploy target to Sanity post category tag
    const categoryMap: Record<string, string> = {
        catalogue_article: 'article',
        catalogue_blog: 'blog',
        catalogue_interview: 'interview',
        personal_blog: 'personal',
    };
    const category = categoryMap[body.deploy_target] || 'article';

    // Build minimal portable text from markdown content
    const bodyBlocks = body.content.split(/\n\n+/).filter(Boolean).map((para: string, i: number) => ({
        _type: 'block',
        _key: `block_${i}`,
        style: para.startsWith('## ') ? 'h2' : para.startsWith('# ') ? 'h1' : 'normal',
        children: [{ _type: 'span', _key: `span_${i}`, text: para.replace(/^#+\s*/, ''), marks: [] }],
        markDefs: [],
    }));

    const sanityDoc = {
        _id: docId,
        _type: 'post',
        title: body.title,
        slug: { _type: 'slug', current: slug },
        excerpt: body.excerpt,
        body: bodyBlocks,
        tags: body.tags,
        category,
        publishedAt: new Date().toISOString(),
        // status field lets Studio know this came from the content bank
        source: 'content-bank',
    };

    const projectId = env.VITE_SANITY_PROJECT_ID;
    const dataset = env.VITE_SANITY_DATASET;
    const token = env.SANITY_WRITE_TOKEN;

    const mutations = [{ createOrReplace: sanityDoc }];
    const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`;

    const sanityRes = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations }),
    });

    if (!sanityRes.ok) {
        const err = await sanityRes.text();
        return new Response(JSON.stringify({ error: `Sanity error: ${err}` }), { status: 502 });
    }

    // Mark as published in D1
    await updateDraftStatus(env.CONTACTS_DB, body.id, 'published', {
        deploy_target: body.deploy_target as never,
        sanity_doc_id: docId,
        published_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ ok: true, sanity_doc_id: docId, slug }), {
        headers: { 'content-type': 'application/json' },
    });
};
