/**
 * POST /api/content-publish
 * Sends a Content Lab draft to Sanity as a post document.
 * The post lands as a DRAFT in Studio — add a thumbnail there, then publish.
 *
 * Required Cloudflare secret: SANITY_WRITE_TOKEN
 *   wrangler pages secret put SANITY_WRITE_TOKEN
 */

import { type ContentBankBindings, updateDraftStatus } from './_contentBank';

// Hardcoded — VITE_ vars are build-time only, not available in Pages Function runtime.
const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

// post.type field values as defined in the Sanity schema
const DEPLOY_TARGET_TO_POST_TYPE: Record<string, string> = {
    catalogue_article: 'Article',
    catalogue_blog: 'Blog',
    catalogue_interview: 'Interview',
    personal_blog: 'Blog', // personal blog posts land as Blog type; add thumbnail in Studio
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 96);
}

function formatDisplayDate(): string {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!env.SANITY_WRITE_TOKEN) {
        return new Response(JSON.stringify({
            error: 'SANITY_WRITE_TOKEN not set. Run: wrangler pages secret put SANITY_WRITE_TOKEN',
        }), { status: 500 });
    }

    const body = await request.json() as {
        id: string;
        title: string;
        excerpt: string;
        content: string;
        tags: string[];
        deploy_target: string;
        source_artist_id?: string; // Sanity _id of the featured artist, if any
    };

    if (!body.id || !body.deploy_target) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const slug = slugify(body.title);
    const docId = `post-contentbank-${body.id}`;
    const postType = DEPLOY_TARGET_TO_POST_TYPE[body.deploy_target] ?? 'Article';

    // Build the Sanity post document matching the actual schema:
    // title (string), slug, type ("Article"|"Blog"|"Interview"), author (string),
    // displayDate (string), publishedAt (datetime), excerpt (text), content (text/markdown),
    // featuredArtist (reference, optional), thumbnail (image, required in Studio but optional via API)
    const sanityDoc: Record<string, unknown> = {
        _id: docId,
        _type: 'post',
        title: body.title,
        slug: { _type: 'slug', current: slug },
        type: postType,
        author: 'Catalogue Content Lab',
        displayDate: formatDisplayDate(),
        publishedAt: new Date().toISOString(),
        excerpt: body.excerpt,
        content: body.content, // plain markdown — schema field is type: 'text'
    };

    // Attach featured artist reference if we have it
    if (body.source_artist_id) {
        sanityDoc.featuredArtist = { _type: 'reference', _ref: body.source_artist_id };
    }

    const mutations = [{ createOrReplace: sanityDoc }];
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`;

    const sanityRes = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
        },
        body: JSON.stringify({ mutations }),
    });

    if (!sanityRes.ok) {
        const errText = await sanityRes.text().catch(() => 'unreadable');
        console.error(`[content-publish] Sanity error ${sanityRes.status}: ${errText}`);
        return new Response(JSON.stringify({
            error: sanityRes.status === 401
                ? 'Sanity token invalid or lacks write permission. Check SANITY_WRITE_TOKEN.'
                : `Sanity mutation failed (${sanityRes.status})`,
        }), { status: 502 });
    }

    // Mark as published in D1
    await updateDraftStatus(env.CONTACTS_DB, body.id, 'published', {
        deploy_target: body.deploy_target as never,
        sanity_doc_id: docId,
        published_at: new Date().toISOString(),
    });

    console.log(`[content-publish] Created Sanity draft: ${docId} (${postType}, slug: ${slug})`);

    return new Response(JSON.stringify({
        ok: true,
        sanity_doc_id: docId,
        slug,
        type: postType,
        note: 'Draft created in Sanity. Open Studio to add a thumbnail and publish.',
    }), { headers: { 'content-type': 'application/json' } });
};
