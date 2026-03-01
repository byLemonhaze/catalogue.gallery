/**
 * POST /api/content-generate
 * Generates 3 drafts (article + blog + wildcard) via Claude API.
 * Protected by CONTENT_LAB_PASSWORD.
 * Called manually from the dashboard OR by the cron trigger.
 */

import {
    type ContentBankBindings,
    type DraftType,
    generateId,
    pruneDrafts,
} from './_contentBank';
import {
    WILDCARD_TOPICS,
    ARTICLE_SYSTEM,
    BLOG_SYSTEM,
    WILDCARD_SYSTEM,
    buildArticlePrompt,
    buildBlogPrompt,
    buildWildcardPrompt,
} from './_contentPrompts';

interface SanityArtistResult {
    _id: string;
    name: string;
    subtitle: string;
}

interface ClaudeContent {
    type: string;
    text: string;
}

interface ClaudeResponse {
    content: ClaudeContent[];
}

interface GeneratedDraft {
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
}

async function fetchRandomArtist(projectId: string, dataset: string): Promise<SanityArtistResult | null> {
    try {
        const query = encodeURIComponent(
            `*[_type in ["artist","gallery"] && status == "approved"]{_id, name, subtitle}`
        );
        const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json() as { result: SanityArtistResult[] };
        const artists = data.result || [];
        if (!artists.length) return null;
        return artists[Math.floor(Math.random() * artists.length)];
    } catch {
        return null;
    }
}

function extractJson(text: string): GeneratedDraft | null {
    // Strip markdown code fences if present
    const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    // Find outermost JSON object
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const jsonStr = stripped.slice(start, end + 1);
    // First attempt — clean JSON
    try { return JSON.parse(jsonStr) as GeneratedDraft; } catch { /* fall through */ }
    // Second attempt — replace literal newlines inside strings (common Claude formatting issue)
    try {
        const fixedStr = jsonStr.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\\n/g, '\\n');
        return JSON.parse(fixedStr) as GeneratedDraft;
    } catch { return null; }
}

async function callClaude(apiKey: string, system: string, userPrompt: string, type: string): Promise<GeneratedDraft | null> {
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096, // 2048 was too small — article JSON needs ~2k tokens, system prompt ~1.5k input
                system,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });
        if (!res.ok) {
            const errBody = await res.text().catch(() => 'unreadable');
            console.error(`[content-generate] Claude API error for ${type}: ${res.status} — ${errBody}`);
            return null;
        }
        const data = await res.json() as ClaudeResponse;
        const text = data.content?.[0]?.text || '';
        if (!text) { console.error(`[content-generate] Empty text from Claude for ${type}`); return null; }
        const draft = extractJson(text);
        if (!draft) { console.error(`[content-generate] JSON parse failed for ${type}. Raw (first 300 chars): ${text.slice(0, 300)}`); }
        return draft;
    } catch (err) {
        console.error(`[content-generate] Fetch error for ${type}:`, err);
        return null;
    }
}

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env, waitUntil }) => {
    // Auth check
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Respond immediately — Claude API calls run in the background via waitUntil.
    // This avoids Cloudflare's 30-second response timeout for 3 parallel LLM calls.
    waitUntil((async () => {
        const db = env.CONTACTS_DB;
        const now = new Date().toISOString();

        const artist = await fetchRandomArtist(env.VITE_SANITY_PROJECT_ID, env.VITE_SANITY_DATASET);
        const artistName = artist?.name ?? 'a contemporary digital artist';
        const artistSubtitle = artist?.subtitle ?? 'Bitcoin-native artist';
        const topic = WILDCARD_TOPICS[Math.floor(Math.random() * WILDCARD_TOPICS.length)];

        const [articleDraft, blogDraft, wildcardDraft] = await Promise.all([
            callClaude(env.CLAUDE_API_KEY, ARTICLE_SYSTEM, buildArticlePrompt(artistName, artistSubtitle), 'article'),
            callClaude(env.CLAUDE_API_KEY, BLOG_SYSTEM, buildBlogPrompt(artistName, artistSubtitle), 'blog'),
            callClaude(env.CLAUDE_API_KEY, WILDCARD_SYSTEM, buildWildcardPrompt(topic), 'wildcard'),
        ]);

        const inserts: Promise<unknown>[] = [];
        const insertDraft = (type: DraftType, draft: GeneratedDraft | null, sourceArtistId: string | null, sourceArtistName: string | null) => {
            if (!draft) return;
            const id = generateId();
            inserts.push(
                db.prepare(`
                    INSERT INTO content_drafts (id, type, title, excerpt, content, tags, source_artist_id, source_artist_name, status, generated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                `).bind(
                    id, type, draft.title, draft.excerpt, draft.content,
                    JSON.stringify(draft.tags || []),
                    sourceArtistId, sourceArtistName, now
                ).run()
            );
        };

        insertDraft('article', articleDraft, artist?._id ?? null, artistName);
        insertDraft('blog', blogDraft, artist?._id ?? null, artistName);
        insertDraft('wildcard', wildcardDraft, null, null);

        await Promise.all(inserts);
        await pruneDrafts(db, 100);
    })());

    return new Response(JSON.stringify({ ok: true, queued: true }), {
        headers: { 'content-type': 'application/json' },
    });
};
