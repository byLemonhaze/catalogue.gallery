import { publicationDate } from './publicationDate';
export const SITE_ORIGIN = 'https://catalogue.gallery';
export type PageMeta = { title: string; description: string; path: string; image?: string; type?: 'website' | 'article'; noindex?: boolean; article?: { title: string; author?: string; publishedAt?: string; updatedAt?: string } };
export function canonicalPath(path: string) {
    const pathname = path.split(/[?#]/)[0].replace(/\/+$/, '');
    return pathname ? `${pathname}/` : '/';
}
export function canonicalUrl(path: string) { return `${SITE_ORIGIN}${canonicalPath(path)}`; }
export function absoluteImage(image?: string) {
    if (image && /^https?:\/\//i.test(image)) return image;
    return `${SITE_ORIGIN}${image?.startsWith('/') ? image : `/${image || 'logo.png'}`}`;
}
export const staticPages: PageMeta[] = [
    { path: '/', title: 'Digital Artists & Independent Art Editorial | CATALOGUE', description: 'Discover independent digital artists, explore their own websites, and read stories and interviews about digital art on CATALOGUE.' },
    { path: '/artists/', title: 'Digital Artists & Galleries Directory | CATALOGUE', description: 'Browse independent digital artists, galleries and curated spaces. Discover their practices and explore their own websites through CATALOGUE.' },
    { path: '/blog/', title: 'Digital Art Stories & Interviews | CATALOGUE', description: 'Stories, conversations, and critical perspectives on digital art. Explore Content Lab, the publication from CATALOGUE.' },
    { path: '/info/', title: 'About CATALOGUE | Independent Digital Art Directory', description: 'Learn about CATALOGUE, an independent publication and directory connecting readers with digital artists, their work and their own websites.' },
    { path: '/submit/', title: 'Submit Your Artist or Gallery Website | CATALOGUE', description: 'Apply to the CATALOGUE directory. Submit your independent artist website or gallery programme for editorial review.' },
    { path: '/content-lab/', title: 'Content Lab Editor | CATALOGUE', description: 'The CATALOGUE editorial workspace.', noindex: true },
    { path: '/content-lab/admin/', title: 'Content Lab Editor | CATALOGUE', description: 'The CATALOGUE editorial workspace.', noindex: true },
];
export function profileMeta(profile: { id: string; type: string; name: string; subtitle?: string; image?: string }): PageMeta {
    return { path: `/${profile.type}/${encodeURIComponent(profile.id)}/`, title: `${profile.name} | CATALOGUE`, description: profile.subtitle?.trim() ? `${profile.subtitle.trim()} — view ${profile.name} on CATALOGUE.` : `View ${profile.name} on CATALOGUE.`, image: profile.image };
}
export function articleMeta(article: { id: string; title: string; excerpt: string; thumbnailUrl?: string; author?: string; publishedAt?: string; displayDate?: string; updatedAt?: string }): PageMeta {
    return { path: `/blog/${encodeURIComponent(article.id)}/`, title: `${article.title} | CATALOGUE`, description: article.excerpt, type: 'article', image: article.thumbnailUrl, article: { title: article.title, author: article.author, publishedAt: publicationDate(article.publishedAt, article.displayDate), updatedAt: article.updatedAt } };
}
export function missingMeta(path: string): PageMeta {
    return { path, title: 'Page Not Found | CATALOGUE', description: 'This page is not available. Explore the CATALOGUE directory and stories.', noindex: true };
}
export function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
const managed = new Set(['description', 'robots', 'og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:url', 'twitter:image']);
function attribute(tag: string, name: string) { return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]; }
export function applyPageMeta(template: string, meta: PageMeta) {
    const url = canonicalUrl(meta.path); const image = absoluteImage(meta.image);
    const values: [string, string, string][] = [
        ['name', 'description', meta.description], ['name', 'robots', meta.noindex ? 'noindex, follow' : 'index, follow'],
        ['property', 'og:type', meta.type || 'website'], ['property', 'og:title', meta.title], ['property', 'og:description', meta.description], ['property', 'og:url', url], ['property', 'og:image', image],
        ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', meta.title], ['name', 'twitter:description', meta.description], ['name', 'twitter:url', url], ['name', 'twitter:image', image],
    ];
    // Mark generated metadata so client navigation and diagnostics can identify it.
    const head = `<title data-rh="true">${escapeHtml(meta.title)}</title>\n<link data-rh="true" rel="canonical" href="${escapeHtml(url)}" />\n` + values.map(([attr, key, value]) => `<meta data-rh="true" ${attr}="${key}" content="${escapeHtml(value)}" />`).join('\n') + `<script data-rh="true" id="catalogue-schema" type="application/ld+json">${JSON.stringify(pageSchema(meta)).replace(/</g, '\\u003c')}</script>`;
    return template.replace(/<script\b[^>]*id=["']catalogue-schema["'][^>]*>[\s\S]*?<\/script>/gi, '').replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\b[^>]*>/gi, tag => managed.has(attribute(tag, 'name') || attribute(tag, 'property') || '') ? '' : tag)
        .replace(/<link\b[^>]*>/gi, tag => attribute(tag, 'rel') === 'canonical' ? '' : tag)
        .replace('</head>', `${head}\n</head>`);
}
export function profileBootstrapHtml(template: string, profile: { id: string; type: string; name: string; websiteUrl?: string; subtitle?: string; desktopExitPosition?: string; mobileExitPosition?: string; seoImageUrl?: string }) {
    const clean = template.replace(/<script\b[^>]*id=["']catalogue-profile["'][^>]*>[\s\S]*?<\/script>/gi, '');
    try {
        const website = new URL(profile.websiteUrl || '');
        if (website.protocol !== 'https:') return clean;
        const data = JSON.stringify(profile).replace(/</g, '\\u003c');
        return clean.replace('</head>', `<script type="application/json" id="catalogue-profile">${data}</script>\n</head>`);
    } catch { return clean; }
}
export function sitemapXml(entries: { path: string; updatedAt?: string }[]) {
    const seen = new Set<string>();
    const rows = entries.map(entry => {
        const url = canonicalUrl(entry.path);
        if (seen.has(url)) throw new Error(`Duplicate sitemap URL: ${url}`);
        seen.add(url);
        const date = entry.updatedAt && !Number.isNaN(Date.parse(entry.updatedAt)) ? new Date(entry.updatedAt).toISOString() : null;
        return `<url><loc>${escapeHtml(url)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.join('')}</urlset>\n`;
}

export function pageSchema(meta: PageMeta) {
    const url = canonicalUrl(meta.path);
    const organization = { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: 'CATALOGUE', url: SITE_ORIGIN, logo: absoluteImage('/logo.png'), sameAs: ['https://x.com/CatalogueART'] };
    const graph: Record<string, unknown>[] = [organization, { '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`, name: 'CATALOGUE', url: SITE_ORIGIN, publisher: { '@id': organization['@id'] } }];
    if (!meta.noindex) {
        graph.push({ '@type': 'WebPage', '@id': `${url}#page`, url, name: meta.title, description: meta.description, isPartOf: { '@id': `${SITE_ORIGIN}/#website` } });
        if (meta.article) {
            const author = meta.article.author || 'CATALOGUE';
            graph.push({ '@type': 'Article', '@id': `${url}#article`, mainEntityOfPage: { '@id': `${url}#page` }, headline: meta.article.title, description: meta.description, image: [absoluteImage(meta.image)], author: /catalogue/i.test(author) ? { '@id': organization['@id'] } : { '@type': 'Person', name: author }, publisher: { '@id': organization['@id'] }, ...(meta.article.publishedAt ? { datePublished: meta.article.publishedAt } : {}), ...(meta.article.updatedAt ? { dateModified: meta.article.updatedAt } : {}) });
        }
        if (meta.path !== '/') {
            const items = [{ name: 'CATALOGUE', item: `${SITE_ORIGIN}/` }];
            if (meta.article) items.push({ name: 'Content Lab', item: `${SITE_ORIGIN}/blog/` });
            items.push({ name: meta.article?.title || meta.title.split(' | ')[0], item: url });
            graph.push({ '@type': 'BreadcrumbList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, ...item })) });
        }
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}
