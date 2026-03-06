/**
 * POST /api/content-generate
 * Generates one or three drafts via Grok-3 with live web + X search.
 * If `type` is provided in body, generates only that one type.
 * Protected by CONTENT_LAB_PASSWORD.
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

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

interface SanityArtistResult {
    _id: string;
    name: string;
    subtitle: string;
    websiteUrl?: string;
    contentBio?: string;
}

interface GrokResponseOutput {
    type: string;
    content?: Array<{ type: string; text?: string }>;
}

interface GrokResponseBody {
    output?: GrokResponseOutput[];
    output_text?: string; // legacy fallback field
}

interface DraftFailure {
    type: DraftType;
    reason: DraftParseReason | 'http_error' | 'request_error' | 'timeout' | 'empty_response';
    detail: string;
    snippet: string;
}

interface ContentGenerateBody {
    artistId?: string;
    artistName?: string;
    artistSubtitle?: string;
    type?: DraftType;
}

// ─── Artist fetch ─────────────────────────────────────────────────────────────

async function fetchRandomArtist(): Promise<SanityArtistResult | null> {
    try {
        const query = encodeURIComponent(
            `*[_type in ["artist","gallery"] && status == "published"]{_id, name, subtitle, websiteUrl, contentBio}`
        );
        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
        const res = await fetch(url);
        if (!res.ok) { console.error(`[content-generate] Sanity fetch failed: ${res.status}`); return null; }
        const data = await res.json() as { result: SanityArtistResult[] };
        const artists = data.result || [];
        if (!artists.length) { console.error('[content-generate] No published artists found in Sanity'); return null; }
        return artists[Math.floor(Math.random() * artists.length)];
    } catch (err) {
        console.error('[content-generate] fetchRandomArtist error:', err);
        return null;
    }
}

// Fallback pool — used when Sanity is unreachable
const FALLBACK_POOL: SanityArtistResult[] = [
    { _id: '', name: 'XCOPY', subtitle: 'Dystopian glitch loops, crypto art OG, mortality and dark humor' },
    { _id: '', name: 'Claire Silver', subtitle: 'AI-collaborative artist, femininity, softness as aesthetic resistance' },
    { _id: '', name: 'William Mapan', subtitle: 'French generative artist, Dragons and Anticyclone, painterly code' },
    { _id: '', name: 'Tyler Hobbs', subtitle: 'Generative artist, Fidenza on Art Blocks, flow field algorithms' },
    { _id: '', name: 'Beeple', subtitle: "Everydays daily practice since 2007, Christie's $69M sale" },
    { _id: '', name: 'Pak', subtitle: 'Anonymous artist, Merge $91.8M total, token mechanics as artistic medium' },
    { _id: '', name: 'Rare Scrilla', subtitle: 'Bitcoin OG, Rare Pepe era trading cards, hip-hop aesthetics' },
    { _id: '', name: 'Robness', subtitle: 'Trash art pioneer, anti-prestige, deliberately low-fi aesthetics' },
    { _id: '', name: 'Lemonhaze', subtitle: 'Paint Engine, BEST BEFORE with Ordinally, Bitcoin-native generative art' },
];

// ─── Grok generation (search + write in one call) ────────────────────────────

const CALL_TIMEOUT: Record<DraftType, number> = {
    article: 120000,
    wildcard: 100000,
    blog: 90000,
};

function snippet(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function buildDraftFailure(
    type: DraftType,
    reason: DraftFailure['reason'],
    detail: string,
    rawSnippet = ''
) {
    return {
        ok: false as const,
        failure: {
            type,
            reason,
            detail,
            snippet: rawSnippet ? snippet(rawSnippet) : '',
        },
    };
}

function extractGrokText(data: GrokResponseBody) {
    if (Array.isArray(data.output)) {
        for (const item of data.output) {
            if (item.type !== 'message' || !Array.isArray(item.content)) {
                continue;
            }

            for (const contentItem of item.content) {
                if (contentItem.type === 'output_text' && contentItem.text) {
                    return contentItem.text.trim();
                }
            }
        }
    }

    return data.output_text?.trim() || '';
}

function buildGrokPrompt(
    type: DraftType,
    artist: SanityArtistResult,
    topic: string
) {
    switch (type) {
        case 'article':
            return {
                system: ARTICLE_SYSTEM,
                input: buildArticlePrompt(artist.name, artist.subtitle, artist.contentBio),
            };
        case 'blog':
            return {
                system: BLOG_SYSTEM,
                input: buildBlogPrompt(artist.name, artist.subtitle, artist.contentBio),
            };
        case 'wildcard':
            return {
                system: WILDCARD_SYSTEM,
                input: buildWildcardPrompt(topic),
            };
    }
}

function resolveRequestedTypes(type?: DraftType): DraftType[] {
    return type ? [type] : ['article', 'blog', 'wildcard'];
}

async function resolveArtist(body: ContentGenerateBody) {
    if (body.artistName) {
        return {
            _id: body.artistId || '',
            name: body.artistName,
            subtitle: body.artistSubtitle || '',
        };
    }

    const fetched = await fetchRandomArtist();
    return fetched ?? FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
}

async function insertGeneratedDrafts(params: {
    db: ContentBankBindings['CONTACTS_DB']
    attempts: Array<{ ok: true; draft: GeneratedDraft } | { ok: false; failure: DraftFailure }>
    requestedTypes: DraftType[]
    artist: SanityArtistResult
    now: string
}) {
    const { db, attempts, requestedTypes, artist, now } = params;
    const inserts: Promise<unknown>[] = [];
    let created = 0;

    for (let index = 0; index < requestedTypes.length; index += 1) {
        const type = requestedTypes[index];
        const attempt = attempts[index];
        const draft = attempt.ok ? attempt.draft : null;

        if (!draft) {
            console.error(`[content-generate] No draft for ${type} — skipping`);
            continue;
        }

        created += 1;
        const id = generateId();
        const isArtistType = type === 'article' || type === 'blog';

        inserts.push(
            db.prepare(`
                INSERT INTO content_drafts
                    (id, type, title, excerpt, content, tags, source_artist_id, source_artist_name, status, generated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            `).bind(
                id,
                type,
                draft.title,
                draft.excerpt,
                draft.content,
                JSON.stringify(draft.tags || []),
                isArtistType ? (artist._id || null) : null,
                isArtistType ? artist.name : null,
                now
            ).run()
        );
    }

    await Promise.all(inserts);
    return created;
}

async function callGrok(
    apiKey: string,
    system: string,
    userPrompt: string,
    type: DraftType
): Promise<{ ok: true; draft: GeneratedDraft } | { ok: false; failure: DraftFailure }> {
    const timeout = CALL_TIMEOUT[type];
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
        console.error(`[content-generate] ${type} aborted after ${timeout / 1000}s`);
    }, timeout);

    try {
        // xAI Responses API — supports live web + X search via tools
        const res = await fetch('https://api.x.ai/v1/responses', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'grok-4-0709',
                instructions: system,
                input: userPrompt,
                tools: [
                    { type: 'web_search' },
                    { type: 'x_search' },
                ],
            }),
        });
        clearTimeout(timer);

        if (!res.ok) {
            const errBody = await res.text().catch(() => 'unreadable');
            console.error(`[content-generate] Grok API ${res.status} for ${type}: ${errBody.slice(0, 400)}`);
            return buildDraftFailure(type, 'http_error', `Grok ${res.status}: ${errBody.slice(0, 150)}`, errBody);
        }

        const data = await res.json() as GrokResponseBody;
        const text = extractGrokText(data);

        if (!text) {
            return buildDraftFailure(type, 'empty_response', 'Grok returned no text.');
        }

        const parsed = parseAndNormalizeDraft(text);
        if (isDraftParseFailure(parsed)) {
            const { failure } = parsed;
            console.error(`[content-generate] Parse failed for ${type}: ${failure.reason} — ${failure.detail}`);
            return buildDraftFailure(type, failure.reason, failure.detail, failure.snippet);
        }

        return { ok: true, draft: parsed.draft };
    } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') {
            return buildDraftFailure(type, 'timeout', `Aborted after ${timeout / 1000}s.`);
        }
        console.error(`[content-generate] callGrok error for ${type}:`, err);
        return buildDraftFailure(type, 'request_error', err instanceof Error ? err.message : 'Unknown');
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!env.GROK_API_KEY) {
        return new Response(JSON.stringify({ error: 'Grok API key not configured' }), { status: 500 });
    }

    const grokKey = env.GROK_API_KEY;
    const db = env.CONTACTS_DB;
    const now = new Date().toISOString();

    const body = await request.json().catch(() => ({})) as ContentGenerateBody;
    const artist = await resolveArtist(body);
    const topic = WILDCARD_TOPICS[Math.floor(Math.random() * WILDCARD_TOPICS.length)];
    const requestedTypes = resolveRequestedTypes(body.type);

    console.log(`[content-generate] Artist: ${artist.name} | Types: ${requestedTypes.join(',')} | bio: ${artist.contentBio ? 'yes' : 'no'}`);

    const attempts = await Promise.all(
        requestedTypes.map((type) => {
            const prompt = buildGrokPrompt(type, artist, topic);
            return callGrok(grokKey, prompt.system, prompt.input, type);
        })
    );

    const failures = attempts
        .filter((attempt): attempt is { ok: false; failure: DraftFailure } => !attempt.ok)
        .map((attempt) => attempt.failure);

    const created = await insertGeneratedDrafts({
        db,
        attempts,
        requestedTypes,
        artist,
        now,
    });
    await pruneDrafts(db, 100);

    console.log(`[content-generate] Done — ${created}/${requestedTypes.length} drafts created via Grok live search`);

    return new Response(JSON.stringify({
        ok: true,
        created,
        attempted: requestedTypes.length,
        failures,
    }), { headers: { 'content-type': 'application/json' } });
};
