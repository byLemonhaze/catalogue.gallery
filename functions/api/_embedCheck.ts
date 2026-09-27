import { normalizeWebsiteUrl, type EmbedCheckResult } from '../../shared/submission';

const CATALOGUE_ORIGIN = 'https://catalogue.gallery';
const providerHelp = 'Ask your website provider to allow embedding from https://catalogue.gallery, then return here to check automatically.';

function sourceAllowsCatalogue(source: string, site: URL): boolean {
    const parent = new URL(CATALOGUE_ORIGIN);
    if (source === '*') return true;
    if (source === "'self'") return site.origin === parent.origin;
    if (source === 'https:' || source === 'http:') return true;
    if (source.startsWith("'")) return false;

    // CSP host sources can omit a scheme and can use wildcard hosts/ports.
    const match = source.match(/^(?:(https?):\/\/)?(\*|\*\.[a-z0-9.-]+|[a-z0-9.-]+)(?::(\*|\d+))?(\/[^?#]*)?$/i);
    if (!match) return false;
    const [, scheme, host, port, path] = match;
    const hostname = host.toLowerCase();
    const hostMatches = hostname === '*' || hostname === parent.hostname ||
        (hostname.startsWith('*.') && parent.hostname.endsWith(hostname.slice(1)));
    // frame-ancestors matches against the ancestor origin, whose path is '/'.
    return hostMatches && (!port || port === '*' || port === '443' || (scheme?.toLowerCase() === 'http' && port === '80')) && (!path || path === '/');
}

export function inspectEmbeddingHeaders(headers: Headers, finalUrl: string): EmbedCheckResult {
    const site = new URL(finalUrl);
    const policies = (headers.get('content-security-policy') || '').split(',');
    const ancestorLists = policies.flatMap(policy => {
        // Browsers use the first occurrence of a directive within each policy.
        const directive = policy.split(';').map(item => item.trim().split(/\s+/))
            .find(parts => parts[0].toLowerCase() === 'frame-ancestors');
        return directive ? [directive.slice(1)] : [];
    });

    if (ancestorLists.length) {
        if (ancestorLists.some(sources => !sources.some(source => sourceAllowsCatalogue(source, site)))) {
            return { status: 'blocked', message: `Your website’s embedding permissions block CATALOGUE. ${providerHelp}` };
        }
    } else {
        // Enforced frame-ancestors overrides X-Frame-Options; report-only CSP does not.
        const options = (headers.get('x-frame-options') || '').toUpperCase().split(',').map(value => value.trim());
        if (options.includes('DENY') || (options.includes('SAMEORIGIN') && site.origin !== CATALOGUE_ORIGIN)) {
            return { status: 'blocked', message: `Your website provider blocks embedding on other sites. ${providerHelp}` };
        }
        if (options.some(value => value && value !== 'SAMEORIGIN')) {
            return { status: 'unknown', message: 'Your website returned unclear embedding permissions. Ask your website provider to allow https://catalogue.gallery.' };
        }
    }
    return { status: 'compatible', message: 'Your website’s permissions allow embedding on CATALOGUE. We’ll also review the site before publishing.' };
}

export async function checkEmbedding(input: string): Promise<EmbedCheckResult> {
    let url = normalizeWebsiteUrl(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        for (let redirects = 0; redirects <= 4; redirects++) {
            // No visitor cookies, authorization headers or response body are forwarded.
            // Workers' outbound fetch restrictions additionally reject private destinations.
            const response = await fetch(url, {
                redirect: 'manual',
                signal: controller.signal,
                headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'Catalogue-Embed-Check/1.0' },
            });
            await response.body?.cancel();
            if ([301, 302, 303, 307, 308].includes(response.status)) {
                const location = response.headers.get('location');
                if (!location) break;
                const next = new URL(location, url);
                if (next.protocol === 'http:') {
                    return { status: 'blocked', message: 'Your website redirects to an insecure HTTP page. Ask your provider to keep the website on HTTPS so it can be embedded on CATALOGUE.' };
                }
                url = normalizeWebsiteUrl(next.href);
                continue;
            }
            if (!response.ok) break;
            const contentType = response.headers.get('content-type') || '';
            if (!/^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(contentType)) break;
            return inspectEmbeddingHeaders(response.headers, url);
        }
    } catch {
        // A timeout, bot challenge, invalid redirect or fetch error is not proof of a block.
    } finally {
        clearTimeout(timeout);
    }
    return { status: 'unknown', message: 'We couldn’t verify this website right now. Check that it is online and publicly accessible. We’ll check again when you return to this page or leave the URL field.' };
}
