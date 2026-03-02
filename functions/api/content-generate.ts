/**
 * POST /api/content-generate
 * Generates one or three drafts via Claude Haiku.
 * If `type` is provided in body, generates only that one type.
 * If GROK_API_KEY is set, first researches the artist via Grok (live X + web search).
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

// Fallback pool — used when Sanity is unreachable, ensures content variety
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

// ─── Grok research (optional) ────────────────────────────────────────────────

async function fetchArtistResearch(
    grokApiKey: string,
    artistName: string
): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
        console.error(`[content-generate] Grok research for ${artistName} timed out after 20s`);
    }, 20000);

    try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${grokApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'grok-3',
                messages: [{
                    role: 'user',
                    content: `You are researching the digital artist "${artistName}" for an editorial writer. CATALOGUE (catalogue.gallery) is a chain-agnostic artist directory covering Ethereum, Bitcoin Ordinals, generative art, and digital-native practices.

From everything you know — including X/Twitter posts, sales records, community discussions, and recent events — give the writer the 5-6 most specific, useful facts about ${artistName}:
- What blockchain or platform their work actually lives on (Ethereum, Bitcoin Ordinals, other, or none — be accurate)
- Most notable recent works or collections (name them specifically)
- Recent notable sales, prices, or market activity
- Their current X/Twitter presence and community reputation
- Any recent collaborations, exhibitions, or controversies
- What specifically makes their practice distinctive in 2024-2025

Be specific with names, dates, prices, and platforms. No generic filler. 200 words max.`,
                }],
                max_tokens: 500,
            }),
        });
        clearTimeout(timer);

        if (!res.ok) {
            const err = await res.text().catch(() => '');
            console.error(`[content-generate] Grok research failed: ${res.status} — ${err.slice(0, 200)}`);
            return null;
        }

        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        const text = data.choices?.[0]?.message?.content?.trim() || null;
        if (text) {
            console.log(`[content-generate] Research for ${artistName}: ${text.slice(0, 100)}…`);
        }
        return text;
    } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error && err.name !== 'AbortError') {
            console.error('[content-generate] Grok research error:', err.message);
        }
        return null;
    }
}

// ─── Claude generation ────────────────────────────────────────────────────────

const CALL_TIMEOUT: Record<DraftType, number> = {
    article: 50000,
    wildcard: 45000,
    blog: 40000,
};

function snippet(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
}

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
        console.error(`[content-generate] ${type} aborted after ${timeout / 1000}s`);
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
                model: 'claude-sonnet-4-6',
                max_tokens: type === 'blog' ? 1024 : 2800,
                system,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });
        clearTimeout(timer);

        if (!res.ok) {
            const errBody = await res.text().catch(() => 'unreadable');
            console.error(`[content-generate] Claude API ${res.status} for ${type}: ${errBody}`);
            return { ok: false, failure: { type, reason: 'http_error', detail: `Claude API ${res.status}`, snippet: snippet(errBody) } };
        }

        const data = await res.json() as ClaudeResponse;
        if (data.stop_reason === 'max_tokens') {
            console.error(`[content-generate] ${type} hit max_tokens — response was truncated`);
        }

        const text = (data.content || [])
            .filter((p): p is ClaudeContent => p?.type === 'text' && typeof p.text === 'string')
            .map(p => p.text)
            .join('\n')
            .trim();

        if (!text) {
            return { ok: false, failure: { type, reason: 'empty_response', detail: 'Claude returned no text.', snippet: '' } };
        }

        const parsed = parseAndNormalizeDraft(text);
        if (isDraftParseFailure(parsed)) {
            const { failure } = parsed;
            console.error(`[content-generate] Parse failed for ${type}: ${failure.reason} — ${failure.detail}`);
            return { ok: false, failure: { type, reason: failure.reason, detail: failure.detail, snippet: failure.snippet } };
        }

        return { ok: true, draft: parsed.draft };
    } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') {
            return { ok: false, failure: { type, reason: 'timeout', detail: `Aborted after ${timeout / 1000}s.`, snippet: '' } };
        }
        console.error(`[content-generate] callClaude error for ${type}:`, err);
        return { ok: false, failure: { type, reason: 'request_error', detail: err instanceof Error ? err.message : 'Unknown', snippet: '' } };
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!env.CLAUDE_API_KEY) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const db = env.CONTACTS_DB;
    const now = new Date().toISOString();

    const body = await request.json().catch(() => ({})) as {
        artistId?: string;
        artistName?: string;
        artistSubtitle?: string;
        type?: DraftType; // if provided, generate only this one type
    };

    // ── Resolve artist ──────────────────────────────────────────────────────
    let artist: SanityArtistResult;
    if (body.artistName) {
        artist = { _id: body.artistId || '', name: body.artistName, subtitle: body.artistSubtitle || '' };
    } else {
        const fetched = await fetchRandomArtist();
        artist = fetched ?? FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
    }

    const { name: artistName, subtitle: artistSubtitle } = artist;
    const topic = WILDCARD_TOPICS[Math.floor(Math.random() * WILDCARD_TOPICS.length)];

    // ── Determine which types to generate ──────────────────────────────────
    const requestedTypes: DraftType[] = body.type ? [body.type] : ['article', 'blog', 'wildcard'];
    const needsArtistContent = requestedTypes.some(t => t === 'article' || t === 'blog');

    console.log(`[content-generate] Artist: ${artistName} | Types: ${requestedTypes.join(',')}${body.type ? ' (single)' : ' (batch)'} | bio: ${artist.contentBio ? 'yes' : 'no'}`);

    // ── Optional Grok research (only for artist-based content) ─────────────
    let research: string | null = null;
    if (needsArtistContent && env.GROK_API_KEY) {
        research = await fetchArtistResearch(env.GROK_API_KEY, artistName);
    }

    // ── Generate ────────────────────────────────────────────────────────────
    const attempts = await Promise.all(
        requestedTypes.map(type => {
            switch (type) {
                case 'article':
                    return callClaude(env.CLAUDE_API_KEY, ARTICLE_SYSTEM, buildArticlePrompt(artistName, artistSubtitle, research, artist.contentBio), 'article');
                case 'blog':
                    return callClaude(env.CLAUDE_API_KEY, BLOG_SYSTEM, buildBlogPrompt(artistName, artistSubtitle, research, artist.contentBio), 'blog');
                case 'wildcard':
                    return callClaude(env.CLAUDE_API_KEY, WILDCARD_SYSTEM, buildWildcardPrompt(topic), 'wildcard');
            }
        })
    );

    const failures = attempts
        .filter((a): a is { ok: false; failure: DraftFailure } => !a.ok)
        .map(a => a.failure);

    // ── Insert into D1 ──────────────────────────────────────────────────────
    const inserts: Promise<unknown>[] = [];
    let created = 0;

    for (let i = 0; i < requestedTypes.length; i++) {
        const type = requestedTypes[i];
        const attempt = attempts[i];
        const draft = attempt.ok ? attempt.draft : null;

        if (!draft) {
            console.error(`[content-generate] No draft for ${type} — skipping`);
            continue;
        }

        created++;
        const id = generateId();
        const isArtistType = type === 'article' || type === 'blog';

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
                isArtistType ? (artist._id || null) : null,
                isArtistType ? artistName : null,
                now
            ).run()
        );
    }

    await Promise.all(inserts);
    await pruneDrafts(db, 100);

    console.log(`[content-generate] Done — ${created}/${requestedTypes.length} drafts created${research ? ' (with Grok research)' : ''}`);

    return new Response(JSON.stringify({
        ok: true,
        created,
        attempted: requestedTypes.length,
        failures,
        researched: !!research,
    }), { headers: { 'content-type': 'application/json' } });
};
