/**
 * Dynamic OG meta injection for article pages.
 *
 * Cloudflare Pages serves static files first — this function is only invoked
 * for articles that don't have a pre-built static file (i.e. published after
 * the last deploy). It fetches the article from Sanity and injects correct
 * OG tags into the SPA shell, so social previews always show the right image.
 */

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

interface Env {
    ASSETS: { fetch(req: Request): Promise<Response> };
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function upsertTag(html: string, attr: 'property' | 'name', key: string, value: string): string {
    const v = esc(value);
    const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i');
    const tag = `<meta ${attr}="${key}" content="${v}" />`;
    return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function injectMeta(html: string, title: string, description: string, url: string, imageUrl: string): string {
    let h = html;
    h = h.replace(/<title>.*?<\/title>/i, `<title>${esc(title)} | CATALOGUE</title>`);
    h = upsertTag(h, 'name',     'description',       description);
    h = upsertTag(h, 'property', 'og:type',            'article');
    h = upsertTag(h, 'property', 'og:title',           title);
    h = upsertTag(h, 'property', 'og:description',     description);
    h = upsertTag(h, 'property', 'og:url',             url);
    h = upsertTag(h, 'property', 'og:image',           imageUrl);
    h = upsertTag(h, 'name',     'twitter:card',       'summary_large_image');
    h = upsertTag(h, 'name',     'twitter:title',      title);
    h = upsertTag(h, 'name',     'twitter:description', description);
    h = upsertTag(h, 'name',     'twitter:url',        url);
    h = upsertTag(h, 'name',     'twitter:image',      imageUrl);
    return h;
}

function resolveSiteOrigin(request: Request) {
    return new URL(request.url).origin.replace(/\/+$/, '');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    const slug = (context.params as Record<string, string>).slug;
    if (!slug) return new Response('Not found', { status: 404 });
    const siteOrigin = resolveSiteOrigin(context.request);
    const defaultImage = `${siteOrigin}/logo.png`;

    let title = 'CATALOGUE';
    let description = 'An independent directory of digital artists.';
    let imageUrl = defaultImage;

    try {
        const query = encodeURIComponent(
            `*[_type == "post" && slug.current == "${slug}"][0]{title, excerpt, "imgUrl": coalesce(featuredArtist->thumbnail.asset->url, thumbnail.asset->url)}`
        );
        const sanityUrl = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
        const sanityRes = await fetch(sanityUrl);
        if (sanityRes.ok) {
            const data = await sanityRes.json() as {
                result?: { title?: string; excerpt?: string; imgUrl?: string };
            };
            const art = data.result;
            if (art?.title) title = art.title;
            if (art?.excerpt) description = art.excerpt;
            if (art?.imgUrl) imageUrl = art.imgUrl;
        }
    } catch { /* silent — fall through to defaults */ }

    // Serve the SPA shell with injected meta
    const indexReq = new Request(`${siteOrigin}/index.html`);
    const indexRes = await context.env.ASSETS.fetch(indexReq);
    if (!indexRes.ok) return new Response('Not found', { status: 404 });

    const html = await indexRes.text();
    const articleUrl = `${siteOrigin}/blog/${slug}`;
    const injected = injectMeta(html, title, description, articleUrl, imageUrl);

    return new Response(injected, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
    });
};
