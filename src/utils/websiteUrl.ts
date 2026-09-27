/** Prepend https:// when scheme is missing — keep in sync with functions/api/_iframeCompat.ts */
export function normalizeWebsiteUrlInput(rawUrl: string): string {
    let input = rawUrl.trim();
    if (!input) return '';
    if (!/^https?:\/\//i.test(input)) {
        input = `https://${input}`;
    }
    try {
        const parsed = new URL(input);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
        parsed.hash = '';
        parsed.username = '';
        parsed.password = '';
        return parsed.toString().replace(/\/+$/, '') || parsed.origin;
    } catch {
        return '';
    }
}

export const IFRAME_FIX_NOTICE =
    'site blocks embeds — allow catalogue.gallery via your host/CDN (CSP frame-ancestors) or unset X-Frame-Options.';
