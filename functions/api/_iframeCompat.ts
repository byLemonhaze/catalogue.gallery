/**
 * Shared iframe / embed compatibility helpers for submit gates.
 * Mirrors what the Apply form's iframe tester is looking for: sites that
 * send X-Frame-Options or CSP frame-ancestors blocking catalogue.gallery.
 */

export type EmbedCheckResult = {
    ok: boolean;
    url: string;
    reason?: string;
    xFrameOptions?: string | null;
    frameAncestors?: string | null;
};

const CATALOGUE_ORIGIN = 'https://catalogue.gallery';
const CATALOGUE_HOST = 'catalogue.gallery';
const FETCH_TIMEOUT_MS = 8000;

/** Prepend https:// when the scheme is missing; strip hash and trailing slashes. */
export function normalizeWebsiteUrl(rawUrl: string): string {
    let input = rawUrl.trim();
    if (!input) {
        throw new Error('Website URL is required');
    }
    if (!/^https?:\/\//i.test(input)) {
        input = `https://${input}`;
    }
    const parsed = new URL(input);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Only http/https website URLs are supported');
    }
    parsed.hash = '';
    parsed.username = '';
    parsed.password = '';
    return parsed.toString().replace(/\/+$/, '') || parsed.origin;
}

function extractFrameAncestors(cspHeader: string | null): string | null {
    if (!cspHeader) return null;
    // CSP can be comma-joined across multiple header values; split on both ; and consider each policy.
    const policies = cspHeader.split(/,(?![^(]*\))/);
    for (const policy of policies) {
        const match = policy.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i);
        if (match) {
            return match[1].trim();
        }
    }
    return null;
}

function hostAllowedBySource(source: string, targetHost: string): boolean {
    const s = source.trim().toLowerCase();
    if (!s || s === "'none'") return false;
    if (s === '*') return true;
    if (s === "'self'") return false; // applicant site ≠ catalogue.gallery
    try {
        // Sources may be scheme-relative (//host), host-only, or full origins, optionally with path.
        let candidate = s;
        if (candidate.startsWith('*.')) {
            const suffix = candidate.slice(1); // .example.com
            return targetHost === candidate.slice(2) || targetHost.endsWith(suffix);
        }
        if (candidate.startsWith('//')) candidate = `https:${candidate}`;
        else if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) candidate = `https://${candidate}`;
        const u = new URL(candidate);
        const host = u.hostname.toLowerCase();
        if (host.startsWith('*.')) {
            const suffix = host.slice(1);
            return targetHost === host.slice(2) || targetHost.endsWith(suffix);
        }
        return targetHost === host || targetHost.endsWith(`.${host}`);
    } catch {
        return false;
    }
}

export function evaluateEmbedHeaders(headers: Headers): Omit<EmbedCheckResult, 'url'> {
    const xfoRaw = headers.get('x-frame-options');
    const xfo = xfoRaw?.trim().toLowerCase() || null;
    const csp = headers.get('content-security-policy');
    const frameAncestors = extractFrameAncestors(csp);

    // Per HTML/CSP: when frame-ancestors is present, X-Frame-Options is ignored.
    if (frameAncestors) {
        const sources = frameAncestors.split(/\s+/).filter(Boolean);
        if (sources.some((s) => s.toLowerCase() === "'none'")) {
            return {
                ok: false,
                reason: 'blocked by CSP frame-ancestors',
                xFrameOptions: xfoRaw,
                frameAncestors,
            };
        }
        const allowsCatalogue = sources.some(
            (s) => hostAllowedBySource(s, CATALOGUE_HOST) || s.toLowerCase() === CATALOGUE_ORIGIN
        );
        if (!allowsCatalogue) {
            return {
                ok: false,
                reason: 'CSP frame-ancestors does not allow catalogue.gallery',
                xFrameOptions: xfoRaw,
                frameAncestors,
            };
        }
        return {
            ok: true,
            xFrameOptions: xfoRaw,
            frameAncestors,
        };
    }

    if (xfo === 'deny' || xfo === 'sameorigin') {
        return {
            ok: false,
            reason: 'blocked by X-Frame-Options',
            xFrameOptions: xfoRaw,
            frameAncestors,
        };
    }

    return {
        ok: true,
        xFrameOptions: xfoRaw,
        frameAncestors,
    };
}

async function fetchHeaders(url: string): Promise<Headers> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const init: RequestInit = {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
            'User-Agent': 'CatalogueGallery-EmbedCheck/1.0 (+https://catalogue.gallery)',
            Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        },
    };

    try {
        let response = await fetch(url, { ...init, method: 'HEAD' });
        // Some hosts reject HEAD; fall back to a ranged GET for headers only.
        if (response.status === 405 || response.status === 501 || response.status === 403) {
            response = await fetch(url, {
                ...init,
                method: 'GET',
                headers: {
                    ...Object.fromEntries(new Headers(init.headers)),
                    Range: 'bytes=0-0',
                },
            });
        }
        if (!response.ok && response.status >= 400 && response.status !== 206) {
            // Still inspect headers on error pages — framing policy often present on 403/404.
            if (!response.headers.has('x-frame-options') && !response.headers.has('content-security-policy')) {
                throw new Error(`Could not reach website (HTTP ${response.status})`);
            }
        }
        return response.headers;
    } finally {
        clearTimeout(timer);
    }
}

/** Server-side embeddability check via response headers. */
export async function checkIframeCompat(rawUrl: string): Promise<EmbedCheckResult> {
    let url: string;
    try {
        url = normalizeWebsiteUrl(rawUrl);
    } catch (err) {
        return {
            ok: false,
            url: rawUrl.trim(),
            reason: err instanceof Error ? err.message : 'Invalid website URL',
        };
    }

    try {
        const headers = await fetchHeaders(url);
        const verdict = evaluateEmbedHeaders(headers);
        return { ...verdict, url };
    } catch (err) {
        const message =
            err instanceof Error && err.name === 'AbortError'
                ? 'Website timed out during embed check'
                : err instanceof Error
                    ? err.message
                    : 'Website unreachable during embed check';
        return { ok: false, url, reason: message };
    }
}

export const IFRAME_FIX_HINT =
    'your site blocks embeds — allow catalogue.gallery via host/CDN headers (CSP frame-ancestors or unset X-Frame-Options).';
