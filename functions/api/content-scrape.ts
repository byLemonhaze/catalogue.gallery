/**
 * POST /api/content-scrape
 * Scrapes an artist's website and saves a structured research bio to their Sanity document.
 * Used by Content Lab before generation to ground Claude in factual, artist-owned information.
 *
 * Workflow:
 *  1. Fetch artist websiteUrl from Sanity
 *  2. Scrape root + /about pages (parallel, 8s each)
 *  3. Extract meta tags + visible text (handles both SSR and SPA sites)
 *  4. Summarize with Claude Haiku into a clean 400-word research document
 *  5. Save to artist.contentBio in Sanity via Mutations API
 *
 * Protected by CONTENT_LAB_PASSWORD.
 */

import { type ContentBankBindings } from './_contentBank';

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

function stripHtml(html: string): string {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function extractMeta(html: string): string {
    const get = (re: RegExp) => (html.match(re)?.[1] || '').replace(/"/g, '').trim();
    const title    = get(/<title[^>]*>([^<]+)<\/title>/i);
    const desc     = get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})/i)
                  || get(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i);
    const ogDesc   = get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{10,})/i);
    const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
    let structured = '';
    try {
        const raw = html.match(jsonLdRe)?.[1];
        if (raw) structured = JSON.stringify(JSON.parse(raw)).slice(0, 400);
    } catch { /* ignore */ }
    return [
        title    && `Page title: ${title}`,
        desc     && `Description: ${desc}`,
        ogDesc && ogDesc !== desc && `OG description: ${ogDesc}`,
        structured && `Structured data: ${structured}`,
    ].filter(Boolean).join('\n');
}

async function fetchPageText(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CATALOGUE-Research/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const html = await res.text();
        const meta = extractMeta(html);
        const body = stripHtml(html).slice(0, 3000);
        const combined = [meta, body].filter(Boolean).join('\n\n');
        return combined.length > 80 ? combined : null;
    } catch {
        return null;
    }
}

async function scrapeArtistWebsite(websiteUrl: string): Promise<string | null> {
    const base = websiteUrl.replace(/\/$/, '');
    const [rootText, aboutText] = await Promise.all([
        fetchPageText(base),
        fetchPageText(`${base}/about`),
    ]);
    const combined = [rootText, aboutText]
        .filter(Boolean)
        .join('\n\n---\n\n')
        .slice(0, 6000);
    return combined.length > 80 ? combined : null;
}

async function summarizeWithHaiku(apiKey: string, artistName: string, rawText: string): Promise<string | null> {
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: AbortSignal.timeout(25000),
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 700,
                messages: [{
                    role: 'user',
                    content: `You are extracting factual research notes from an artist's website for an editorial writer at CATALOGUE (catalogue.gallery).

Artist name: ${artistName}
Website content (may be incomplete — SPA pages may show limited text):
---
${rawText.slice(0, 5000)}
---

Extract and write clean prose covering (max 400 words, only state what is explicitly on the site):
- What medium, technology, or platform they work with — CRITICAL: which blockchain if any (Bitcoin Ordinals, Ethereum, Tezos, etc.), or none at all
- Key series, collections, or projects with names and approximate dates
- Artist statement or values if mentioned
- Any notable exhibitions, sales, recognitions, or collaborations
- What makes their practice visually or conceptually distinctive

Be factual. Only include information that is actually present. Do not infer, embellish, or fill gaps. If content is sparse (likely a SPA), write only what you have.`,
                }],
            }),
        });
        if (!res.ok) return null;
        const data = await res.json() as { content: Array<{ type: string; text: string }> };
        return data.content?.find(b => b.type === 'text')?.text?.trim() || null;
    } catch {
        return null;
    }
}

export const onRequestPost: PagesFunction<ContentBankBindings> = async ({ request, env }) => {
    const auth = request.headers.get('x-content-lab-password') || '';
    if (auth !== env.CONTENT_LAB_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as { artistId?: string };
    if (!body.artistId) {
        return new Response(JSON.stringify({ error: 'Missing artistId' }), { status: 400 });
    }

    // Fetch artist from Sanity
    const q = encodeURIComponent(`*[_id == "${body.artistId}"][0]{_id, _type, name, websiteUrl}`);
    const sanityUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${q}`;

    const sanityRes = await fetch(sanityUrl);
    if (!sanityRes.ok) {
        return new Response(JSON.stringify({ error: 'Could not fetch artist from Sanity' }), { status: 502 });
    }

    const sanityData = await sanityRes.json() as {
        result: { _id: string; _type: string; name: string; websiteUrl?: string } | null;
    };
    const artist = sanityData.result;

    if (!artist) {
        return new Response(JSON.stringify({ error: 'Artist not found' }), { status: 404 });
    }
    if (!artist.websiteUrl) {
        return new Response(JSON.stringify({ error: 'Artist has no websiteUrl — add it in Studio first.' }), { status: 400 });
    }

    console.log(`[content-scrape] Scraping ${artist.name} @ ${artist.websiteUrl}`);

    const rawText = await scrapeArtistWebsite(artist.websiteUrl);
    if (!rawText) {
        return new Response(JSON.stringify({ error: 'Could not scrape website — it may block crawlers or require JavaScript.' }), { status: 422 });
    }

    const bio = await summarizeWithHaiku(env.CLAUDE_API_KEY, artist.name, rawText);
    if (!bio) {
        return new Response(JSON.stringify({ error: 'Summarization failed — check CLAUDE_API_KEY.' }), { status: 502 });
    }

    // Save to Sanity
    if (!env.SANITY_WRITE_TOKEN) {
        return new Response(JSON.stringify({ error: 'SANITY_WRITE_TOKEN not configured.' }), { status: 500 });
    }

    const mutations = [{
        patch: {
            id: artist._id,
            set: {
                contentBio: bio,
                contentBioUpdatedAt: new Date().toISOString(),
            },
        },
    }];

    const mutateUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`;
    const mutateRes = await fetch(mutateUrl, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
        },
        body: JSON.stringify({ mutations }),
    });

    if (!mutateRes.ok) {
        const err = await mutateRes.text().catch(() => '');
        console.error(`[content-scrape] Sanity patch failed: ${mutateRes.status} ${err.slice(0, 200)}`);
        return new Response(JSON.stringify({ error: 'Failed to save to Sanity.' }), { status: 502 });
    }

    console.log(`[content-scrape] Saved contentBio for ${artist.name} (${bio.length} chars)`);

    return new Response(JSON.stringify({ ok: true, bio, artistName: artist.name }), {
        headers: { 'content-type': 'application/json' },
    });
};
