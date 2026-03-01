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
import {
    type DraftParseReason,
    type GeneratedDraft,
    isDraftParseFailure,
    parseAndNormalizeDraft,
} from './_draftParser';

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

interface DraftFailure {
    type: DraftType;
    reason: DraftParseReason | 'http_error' | 'request_error' | 'timeout' | 'empty_response';
    detail: string;
    snippet: string;
}

async function fetchRandomArtist(): Promise<SanityArtistResult | null> {
    try {
        const query = encodeURIComponent(
            `*[_type in ["artist","gallery"] && status == "published"]{_id, name, subtitle}`
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

function snippet(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
}

// Per-type timeout budget (ms): article is longest output, blog fastest
const CALL_TIMEOUT: Record<DraftType, number> = {
    article: 28000,
    wildcard: 22000,
    blog: 16000,
};

async function callClaude(
    apiKey: string,
    system: string,
    userPrompt: string,
    type: DraftType
): Promise<{ ok: true; draft: GeneratedDraft } | { ok: false; failure: DraftFailure }> {
    const timeout = CALL_TIMEOUT[type];
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
        console.error(`[content-generate] ${type} call aborted after ${timeout / 1000}s`);
    }, timeout);

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
                max_tokens: type === 'blog' ? 1024 : 2800,
                system,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });
        clearTimeout(timer);

        if (!res.ok) {
            const errBody = await res.text().catch(() => 'unreadable');
            console.error(`[content-generate] Claude API ${res.status} for ${type}: ${errBody}`);
            return {
                ok: false,
                failure: {
                    type,
                    reason: 'http_error',
                    detail: `Claude API ${res.status}`,
                    snippet: snippet(errBody),
                },
            };
        }

        const data = await res.json() as ClaudeResponse;

        if (data.stop_reason === 'max_tokens') {
            console.error(`[content-generate] ${type} hit max_tokens — response was truncated`);
        }

        const text = (data.content || [])
            .filter((part): part is ClaudeContent => part?.type === 'text' && typeof part.text === 'string')
            .map((part) => part.text)
            .join('\n')
            .trim();

        if (!text) {
            console.error(`[content-generate] Empty text from Claude for ${type}`);
            return {
                ok: false,
                failure: {
                    type,
                    reason: 'empty_response',
                    detail: 'Claude returned no text content.',
                    snippet: '',
                },
            };
        }

        const parsed = parseAndNormalizeDraft(text);
        if (isDraftParseFailure(parsed)) {
            const { failure } = parsed;
            console.error(
                `[content-generate] Parse failed for ${type}: ${failure.reason} — ${failure.detail}`
            );
            return {
                ok: false,
                failure: {
                    type,
                    reason: failure.reason,
                    detail: failure.detail,
                    snippet: failure.snippet,
                },
            };
        }

        return { ok: true, draft: parsed.draft };
    } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') {
            return {
                ok: false,
                failure: {
                    type,
                    reason: 'timeout',
                    detail: 'Claude call aborted after 25s.',
                    snippet: '',
                },
            };
        }
        console.error(`[content-generate] callClaude error for ${type}:`, err);
        return {
            ok: false,
            failure: {
                type,
                reason: 'request_error',
                detail: err instanceof Error ? err.message : 'Unknown error',
                snippet: '',
            },
        };
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

    // Accept optional artist override from the UI picker
    const body = await request.json().catch(() => ({})) as {
        artistId?: string;
        artistName?: string;
        artistSubtitle?: string;
    };

    // Fallback pool for when Sanity is unreachable — ensures variety even without live data
    const FALLBACK_POOL = [
        { _id: '', name: 'XCOPY', subtitle: 'Dystopian glitch loops, crypto art OG, mortality and dark humor' },
        { _id: '', name: 'Claire Silver', subtitle: 'AI-collaborative artist, femininity, softness as aesthetic resistance' },
        { _id: '', name: 'William Mapan', subtitle: 'French generative artist, Dragons and Anticyclone, painterly code' },
        { _id: '', name: 'Tyler Hobbs', subtitle: 'Generative artist, Fidenza on Art Blocks, flow field algorithms' },
        { _id: '', name: 'Beeple', subtitle: 'Everydays daily practice since 2007, Christie\'s $69M sale' },
        { _id: '', name: 'Pak', subtitle: 'Anonymous artist, Merge $91.8M total, token mechanics as artistic medium' },
        { _id: '', name: 'Rare Scrilla', subtitle: 'Bitcoin OG, Rare Pepe era trading cards, hip-hop aesthetics' },
        { _id: '', name: 'Robness', subtitle: 'Trash art pioneer, anti-prestige, deliberately low-fi aesthetics' },
        { _id: '', name: 'Lemonhaze', subtitle: 'Paint Engine, BEST BEFORE with Ordinally, Bitcoin-native generative art' },
    ];

    let artist: { _id: string; name: string; subtitle: string } | null = null;
    if (body.artistName) {
        // UI picker provided a specific artist — use it directly
        artist = { _id: body.artistId || '', name: body.artistName, subtitle: body.artistSubtitle || '' };
    } else {
        // No selection — pick randomly from the live directory
        artist = await fetchRandomArtist();
        // If Sanity unreachable, fall back to known artists rather than a vague placeholder
        if (!artist) {
            artist = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
        }
    }

    const artistName = artist.name;
    const artistSubtitle = artist.subtitle;
    const topic = WILDCARD_TOPICS[Math.floor(Math.random() * WILDCARD_TOPICS.length)];

    console.log(`[content-generate] Artist: ${artistName} | Topic: ${topic.subject}`);

    // Generate all 3 in parallel with Haiku — ~5-10s each, ~12s total in parallel
    const attempts = await Promise.all([
        callClaude(env.CLAUDE_API_KEY, ARTICLE_SYSTEM, buildArticlePrompt(artistName, artistSubtitle), 'article'),
        callClaude(env.CLAUDE_API_KEY, BLOG_SYSTEM, buildBlogPrompt(artistName, artistSubtitle), 'blog'),
        callClaude(env.CLAUDE_API_KEY, WILDCARD_SYSTEM, buildWildcardPrompt(topic), 'wildcard'),
    ]);
    const failures = attempts.filter((attempt): attempt is { ok: false; failure: DraftFailure } => !attempt.ok)
        .map((attempt) => attempt.failure);

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

    const articleAttempt = attempts[0];
    const blogAttempt = attempts[1];
    const wildcardAttempt = attempts[2];

    insertDraft('article', articleAttempt.ok ? articleAttempt.draft : null, artist._id || null, artistName);
    insertDraft('blog', blogAttempt.ok ? blogAttempt.draft : null, artist._id || null, artistName);
    insertDraft('wildcard', wildcardAttempt.ok ? wildcardAttempt.draft : null, null, null);

    await Promise.all(inserts);
    await pruneDrafts(db, 100);

    console.log(`[content-generate] Done — ${created}/3 drafts created`);
    if (failures.length) {
        for (const failure of failures) {
            console.error(`[content-generate] ${failure.type} failed: ${failure.reason} — ${failure.detail}`);
        }
    }

    return new Response(JSON.stringify({
        ok: true,
        created,
        attempted: attempts.length,
        failures,
    }), {
        headers: { 'content-type': 'application/json' },
    });
};
