export interface GeneratedDraft {
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
}

export type DraftParseReason =
    | 'empty_response'
    | 'no_json_object'
    | 'json_parse_failed'
    | 'invalid_shape';

export interface DraftParseFailure {
    reason: DraftParseReason;
    detail: string;
    snippet: string;
}

export type DraftParseResult =
    | { ok: true; draft: GeneratedDraft }
    | { ok: false; failure: DraftParseFailure };

export function isDraftParseFailure(result: DraftParseResult): result is { ok: false; failure: DraftParseFailure } {
    return !result.ok;
}

const MAX_SNIPPET_LENGTH = 220;

function toSnippet(text: string): string {
    const compact = text.replace(/\s+/g, ' ').trim();
    if (compact.length <= MAX_SNIPPET_LENGTH) return compact;
    return `${compact.slice(0, MAX_SNIPPET_LENGTH)}...`;
}

function stripCodeFence(text: string): string {
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export function extractBalancedJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    if (start === -1) return null;

    let inString = false;
    let escaped = false;
    let depth = 0;

    for (let i = start; i < text.length; i++) {
        const char = text[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === '{') depth++;
        if (char === '}') depth--;

        if (depth === 0) {
            return text.slice(start, i + 1);
        }
    }

    return null;
}

function escapeControlCharsInStrings(text: string): string {
    let out = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (escaped) {
            out += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            out += char;
            escaped = true;
            continue;
        }

        if (char === '"') {
            out += char;
            inString = !inString;
            continue;
        }

        if (inString) {
            if (char === '\n') {
                out += '\\n';
                continue;
            }
            if (char === '\r') {
                out += '\\r';
                continue;
            }
            if (char === '\t') {
                out += '\\t';
                continue;
            }
        }

        out += char;
    }

    return out;
}

function repairJsonCandidate(text: string): string {
    return escapeControlCharsInStrings(
        text
            .replace(/^\uFEFF/, '')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, '\'')
            .replace(/,\s*([}\]])/g, '$1')
    );
}

function parseJsonCandidate(text: string): unknown | null {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        // fall through to repaired parse attempt
    }

    try {
        return JSON.parse(repairJsonCandidate(text)) as unknown;
    } catch {
        return null;
    }
}

function normalizeTags(raw: unknown): string[] {
    const source = Array.isArray(raw)
        ? raw
        : (typeof raw === 'string' ? raw.split(',') : []);

    const tags = source
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .map((value) => value.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'))
        .map((value) => value.replace(/^-+|-+$/g, ''))
        .filter(Boolean);

    return [...new Set(tags)];
}

function normalizeDraft(raw: unknown): GeneratedDraft | null {
    if (!raw || typeof raw !== 'object') return null;

    const candidate = raw as Record<string, unknown>;
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
    const excerpt = typeof candidate.excerpt === 'string' ? candidate.excerpt.trim() : '';
    const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';

    if (!title || !excerpt || !content) return null;

    return {
        title,
        excerpt,
        content,
        tags: normalizeTags(candidate.tags),
    };
}

function collectCandidates(rawText: string): string[] {
    const seeds: string[] = [rawText.trim()];
    const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;
    let match: RegExpExecArray | null;

    while ((match = fencePattern.exec(rawText)) !== null) {
        seeds.push(match[1].trim());
    }

    seeds.push(stripCodeFence(rawText.trim()));

    const set = new Set<string>();
    for (const seed of seeds) {
        const trimmed = seed.trim();
        if (!trimmed) continue;
        set.add(trimmed);
        const balanced = extractBalancedJsonObject(trimmed);
        if (balanced) set.add(balanced.trim());
    }

    return [...set];
}

export function parseAndNormalizeDraft(rawText: string): DraftParseResult {
    const text = rawText.trim();
    if (!text) {
        return {
            ok: false,
            failure: {
                reason: 'empty_response',
                detail: 'Model returned empty text.',
                snippet: '',
            },
        };
    }

    const candidates = collectCandidates(text);
    const hasJsonShape = candidates.some((candidate) => candidate.includes('{') && candidate.includes('}'));

    let sawInvalidShape = false;
    let lastParsedSnippet = '';

    for (const candidate of candidates) {
        const parsed = parseJsonCandidate(candidate);
        if (parsed === null) continue;

        lastParsedSnippet = toSnippet(candidate);
        const normalized = normalizeDraft(parsed);
        if (normalized) {
            return { ok: true, draft: normalized };
        }

        sawInvalidShape = true;
    }

    if (!hasJsonShape) {
        return {
            ok: false,
            failure: {
                reason: 'no_json_object',
                detail: 'No JSON object found in model response.',
                snippet: toSnippet(text),
            },
        };
    }

    if (sawInvalidShape) {
        return {
            ok: false,
            failure: {
                reason: 'invalid_shape',
                detail: 'Parsed JSON did not match required draft fields.',
                snippet: lastParsedSnippet || toSnippet(text),
            },
        };
    }

    return {
        ok: false,
        failure: {
            reason: 'json_parse_failed',
            detail: 'Response looked JSON-like but could not be parsed.',
            snippet: toSnippet(text),
        },
    };
}
