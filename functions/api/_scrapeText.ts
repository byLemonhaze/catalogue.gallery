import { Parser } from 'htmlparser2';
import { normalizeWebsiteUrl } from '../../shared/submission';

const OMIT = new Set(['script', 'style', 'nav', 'footer', 'template', 'noscript']);
const MAX_PAGE_BYTES = 1_000_000;

export function stripHtml(html: string): string {
    const text: string[] = [];
    let omittedDepth = 0;
    // Parse HTML as text, never as executable markup. Entity decoding happens once.
    const parser = new Parser({
        onopentag(name) {
            if (omittedDepth || OMIT.has(name)) omittedDepth++;
            else text.push(' ');
        },
        ontext(value) { if (!omittedDepth) text.push(value); },
        onclosetag() {
            if (omittedDepth) omittedDepth--;
            else text.push(' ');
        },
    }, { decodeEntities: true });
    parser.end(html);
    return text.join('').replace(/\s+/g, ' ').trim();
}

export async function fetchWebsiteHtml(input: string): Promise<string | null> {
    let url = normalizeWebsiteUrl(input);
    const signal = AbortSignal.timeout(8000);
    for (let redirects = 0; redirects <= 4; redirects++) {
        const response = await fetch(url, {
            redirect: 'manual', signal,
            headers: { 'User-Agent': 'CATALOGUE-Research/1.0', Accept: 'text/html,application/xhtml+xml' },
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            await response.body?.cancel();
            const location = response.headers.get('location');
            if (!location) return null;
            // Apply the same public HTTPS URL policy to every redirect destination.
            url = normalizeWebsiteUrl(new URL(location, url).href);
            continue;
        }
        if (!response.ok || !/^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(response.headers.get('content-type') || '')) {
            await response.body?.cancel();
            return null;
        }
        const reader = response.body?.getReader();
        if (!reader) return null;
        const decoder = new TextDecoder();
        let bytes = 0;
        let html = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) return html + decoder.decode();
                bytes += value.byteLength;
                if (bytes > MAX_PAGE_BYTES) return null;
                html += decoder.decode(value, { stream: true });
            }
        } finally { await reader.cancel(); }
    }
    return null;
}
