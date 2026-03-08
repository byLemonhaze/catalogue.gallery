import {
    ARTICLE_SYSTEM,
    BLOG_SYSTEM,
    WILDCARD_SYSTEM,
    WILDCARD_TOPICS,
    buildArticlePrompt,
    buildBlogPrompt,
    buildWildcardPrompt,
} from './prompts';
import {
    type DraftParseReason,
    type GeneratedDraft,
    isDraftParseFailure,
    parseAndNormalizeDraft,
} from './draftParser';

export type ContentLabDraftType = 'article' | 'blog' | 'wildcard';

export interface ContentLabArtistSeed {
    _id?: string;
    name: string;
    subtitle: string;
    contentBio?: string;
}

export interface ContentLabGenerationFailure {
    type: ContentLabDraftType;
    reason: DraftParseReason | 'http_error' | 'request_error' | 'timeout' | 'empty_response';
    detail: string;
    snippet: string;
}

type GenerationResult =
    | { ok: true; draft: GeneratedDraft }
    | { ok: false; failure: ContentLabGenerationFailure };

interface XaiResponseOutput {
    type: string;
    content?: Array<{ type: string; text?: string }>;
}

interface XaiResponseBody {
    output?: XaiResponseOutput[];
    output_text?: string;
}

const CALL_TIMEOUT: Record<ContentLabDraftType, number> = {
    article: 120000,
    wildcard: 100000,
    blog: 90000,
};

function snippet(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function buildDraftFailure(
    type: ContentLabDraftType,
    reason: ContentLabGenerationFailure['reason'],
    detail: string,
    rawSnippet = ''
): GenerationResult {
    return {
        ok: false,
        failure: {
            type,
            reason,
            detail,
            snippet: rawSnippet ? snippet(rawSnippet) : '',
        },
    };
}

function extractXaiText(data: XaiResponseBody) {
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

function buildPrompt(type: ContentLabDraftType, artist: ContentLabArtistSeed | null) {
    switch (type) {
        case 'article':
            if (!artist) throw new Error('Artist context is required for article generation.');
            return {
                system: ARTICLE_SYSTEM,
                input: buildArticlePrompt(artist.name, artist.subtitle, artist.contentBio),
            };
        case 'blog':
            if (!artist) throw new Error('Artist context is required for blog generation.');
            return {
                system: BLOG_SYSTEM,
                input: buildBlogPrompt(artist.name, artist.subtitle, artist.contentBio),
            };
        case 'wildcard': {
            const topic = WILDCARD_TOPICS[Math.floor(Math.random() * WILDCARD_TOPICS.length)];
            return {
                system: WILDCARD_SYSTEM,
                input: buildWildcardPrompt(topic),
            };
        }
    }
}

export async function generateDraftWithByok(params: {
    apiKey: string;
    type: ContentLabDraftType;
    artist: ContentLabArtistSeed | null;
}): Promise<GenerationResult> {
    const { apiKey, type, artist } = params;
    const prompt = buildPrompt(type, artist);
    const timeout = CALL_TIMEOUT[type];
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch('https://api.x.ai/v1/responses', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-store',
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'grok-4-0709',
                instructions: prompt.system,
                input: prompt.input,
                tools: [
                    { type: 'web_search' },
                    { type: 'x_search' },
                ],
            }),
        });
        window.clearTimeout(timer);

        if (!res.ok) {
            const errorText = await res.text().catch(() => 'unreadable');
            return buildDraftFailure(type, 'http_error', `xAI ${res.status}: ${errorText.slice(0, 150)}`, errorText);
        }

        const data = await res.json() as XaiResponseBody;
        const text = extractXaiText(data);
        if (!text) {
            return buildDraftFailure(type, 'empty_response', 'xAI returned no text.');
        }

        const parsed = parseAndNormalizeDraft(text);
        if (isDraftParseFailure(parsed)) {
            return buildDraftFailure(type, parsed.failure.reason, parsed.failure.detail, parsed.failure.snippet);
        }

        return { ok: true, draft: parsed.draft };
    } catch (error: unknown) {
        window.clearTimeout(timer);
        if (error instanceof Error && error.name === 'AbortError') {
            return buildDraftFailure(type, 'timeout', `Aborted after ${timeout / 1000}s.`);
        }

        return buildDraftFailure(
            type,
            'request_error',
            error instanceof Error ? error.message : 'Unknown request error.',
        );
    }
}
