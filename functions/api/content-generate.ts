/**
 * POST /api/content-generate
 * Generates 3 drafts (article + blog + wildcard) via Claude API.
 * Protected by CONTENT_LAB_PASSWORD.
 * Called manually from the dashboard OR by the GitHub Actions cron.
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

// Hardcoded — VITE_ prefixed vars are build-time only, not available in Pages Function runtime.
const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

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
    stop_reason?: string;
}

interface GeneratedDraft {
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
}

async function fetchRandomArtist(): Promise<SanityArtistResult | null> {
    try {
        const query = encodeURIComponent(
            `*[_type in ["artist","gallery"] && status == "approved"]{_id, name, subtitle}`
        );
        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
        const res = await fetch(url);
        if (!res.ok) { console.error(`[content-generate] Sanity fetch failed: ${res.status}`); return null; }
        const data = await res.json() as { result: SanityArtistResult[] };
        const artists = data.result || [];
        if (!artists.length) { console.error('[content-generate] No approved artists found in Sanity'); return null; }
        return artists[Math.floor(Math.random() * artists.length)];
    } catch (err) {
        console.error('[content-generate] fetchRandomArtist error:', err);
        return null;
    }
}

function extractJson(text: string): GeneratedDraft | null {
    // Strip markdown code fences if present
    const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const jsonStr = stripped.slice(start, end + 1);

    // First attempt — clean JSON
    try { return JSON.parse(jsonStr) as GeneratedDraft; } catch { /* fall through */ }

    // Second attempt — replace literal newlines inside strings
    try {
        const fixedStr = jsonStr.replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n');
        return JSON.parse(fixedStr) as GeneratedDraft;
    } catch { return null; }
}

async function callClaude(
    apiKey: string,
    system: string,
    userPrompt: string,
    type: string
): Promise<GeneratedDraft | null> {
    // 25-second per-call timeout — prevents a single hung request from blocking everything
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
        console.error(`[content-generate] ${type} call aborted after 25s`);
    }, 25000);

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 4096,
                system,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });
        clearTimeout(timer);

        if (!res.ok) {
            const errBody = await res.text().catch(() => 'unreadable');
            console.error(`[content-generate] Claude API ${res.status} for ${type}: ${errBody}`);
            return null;
        }

        const data = await res.json() as ClaudeResponse;

        if (data.stop_reason === 'max_tokens') {
            console.error(`[content-generate] ${type} hit max_tokens — response was truncated`);
        }

        const text = data.content?.[0]?.text || '';
        if (!text) { console.error(`[content-generate] Empty text from Claude for ${type}`); return null; }

        const draft = extractJson(text);
        if (!draft) {
            console.error(`[content-generate] JSON parse failed for ${type}. First 400 chars: ${text.slice(0, 400)}`);
        }
        return draft;
    } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') return null; // already logged
        console.error(`[content-generate] callClaude error for ${type}:`, err);
        return null;
    }
}

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    // Auth check
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!env.CLAUDE_API_KEY) {
        console.error('[content-generate] CLAUDE_API_KEY not set');
        return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const db = env.CONTACTS_DB;
    const now = new Date().toISOString();

    // Fetch a real artist from the directory (VITE_ vars not available at runtime — hardcoded above)
    const artist = await fetchRandomArtist();
    const artistName = artist?.name ?? 'a contemporary digital artist';
    const artistSubtitle = artist?.subtitle ?? 'Bitcoin-native artist';
    const topic = WILDCARD_TOPICS[Math.floor(Math.random() * WILDCARD_TOPICS.length)];

    console.log(`[content-generate] Artist: ${artistName} | Topic: ${topic.subject}`);

    // Generate all 3 in parallel with Haiku — ~5-10s each, ~12s total in parallel
    const [articleDraft, blogDraft, wildcardDraft] = await Promise.all([
        callClaude(env.CLAUDE_API_KEY, ARTICLE_SYSTEM, buildArticlePrompt(artistName, artistSubtitle), 'article'),
        callClaude(env.CLAUDE_API_KEY, BLOG_SYSTEM, buildBlogPrompt(artistName, artistSubtitle), 'blog'),
        callClaude(env.CLAUDE_API_KEY, WILDCARD_SYSTEM, buildWildcardPrompt(topic), 'wildcard'),
    ]);

    const inserts: Promise<unknown>[] = [];
    let created = 0;

    const insertDraft = (
        type: DraftType,
        draft: GeneratedDraft | null,
        sourceArtistId: string | null,
        sourceArtistName: string | null
    ) => {
        if (!draft) { console.error(`[content-generate] No draft for ${type} — skipping insert`); return; }
        created++;
        const id = generateId();
        inserts.push(
            db.prepare(`
                INSERT INTO content_drafts
                    (id, type, title, excerpt, content, tags, source_artist_id, source_artist_name, status, generated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            `).bind(
                id, type,
                draft.title,
                draft.excerpt,
                draft.content,
                JSON.stringify(draft.tags || []),
                sourceArtistId,
                sourceArtistName,
                now
            ).run()
        );
    };

    insertDraft('article', articleDraft, artist?._id ?? null, artistName);
    insertDraft('blog', blogDraft, artist?._id ?? null, artistName);
    insertDraft('wildcard', wildcardDraft, null, null);

    await Promise.all(inserts);
    await pruneDrafts(db, 100);

    console.log(`[content-generate] Done — ${created}/3 drafts created`);

    return new Response(JSON.stringify({ ok: true, created }), {
        headers: { 'content-type': 'application/json' },
    });
};
