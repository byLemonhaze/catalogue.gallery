import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { articles as legacyArticles } from '../src/data/articles';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const SITE_ORIGIN = 'https://catalogue.gallery';
const PROFILE_OG_DIR = path.join(DIST_DIR, 'og', 'profiles');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'logo.png');

type MetaArticle = {
    id: string;
    title: string;
    excerpt: string;
    thumbnailUrl: string;
};

type MetaProfile = {
    id: string;
    route: 'artist' | 'gallery';
    name: string;
    subtitle: string;
    thumbnailUrl: string;
};

function normalizeImageUrl(input: string | undefined) {
    if (!input) return `${SITE_ORIGIN}/logo.png`;
    if (/^https?:\/\//i.test(input)) return input;
    return `${SITE_ORIGIN}${input.startsWith('/') ? input : `/${input}`}`;
}

function toLegacyMetaArticles(): MetaArticle[] {
    return legacyArticles.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        thumbnailUrl: normalizeImageUrl(article.thumbnail || '/logo.png'),
    }));
}

async function fetchSanityMetaArticles(): Promise<MetaArticle[]> {
    const projectId = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo';
    const dataset = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production';
    const apiVersion = 'v2024-01-01';

    const query = `*[_type == "post" && defined(slug.current)]
      | order(coalesce(publishedAt, _createdAt) desc) {
        "id": slug.current,
        title,
        excerpt,
        "featuredArtistThumbnailAssetUrl": featuredArtist->thumbnail.asset->url,
        thumbnailPath,
        "thumbnailAssetUrl": thumbnail.asset->url
      }`;

    const url = new URL(`https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}`);
    url.searchParams.set('query', query);

    const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Sanity query failed (${response.status})`);
    }

    const body = await response.json() as {
        result?: Array<{
            id?: string;
            title?: string;
            excerpt?: string;
            featuredArtistThumbnailAssetUrl?: string;
            thumbnailPath?: string;
            thumbnailAssetUrl?: string;
        }>;
    };

    const posts = body.result || [];

    return posts
        .filter((post) => Boolean(post.id && post.title && post.excerpt))
        .map((post) => ({
            id: post.id as string,
            title: post.title as string,
            excerpt: post.excerpt as string,
            thumbnailUrl: normalizeImageUrl(
                post.featuredArtistThumbnailAssetUrl || post.thumbnailAssetUrl || post.thumbnailPath || '/logo.png',
            ),
        }));
}

async function resolveMetaArticles() {
    try {
        const sanityArticles = await fetchSanityMetaArticles();
        if (sanityArticles.length > 0) {
            console.log(`Using ${sanityArticles.length} Sanity posts for social meta generation.`);
            return sanityArticles;
        }
    } catch (error) {
        console.warn('Sanity post fetch failed, falling back to legacy local article data.', error);
    }

    const fallback = toLegacyMetaArticles();
    console.log(`Using ${fallback.length} legacy local posts for social meta generation.`);
    return fallback;
}

async function fetchSanityMetaProfiles(): Promise<MetaProfile[]> {
    const projectId = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo';
    const dataset = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production';
    const apiVersion = 'v2024-01-01';

    const query = `*[_type in ["artist", "gallery"] && defined(slug.current) && (status == "published" || !defined(status))]
      | order(name asc) {
        "id": slug.current,
        "route": _type,
        name,
        subtitle,
        "thumbnailAssetUrl": thumbnail.asset->url
      }`;

    const url = new URL(`https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}`);
    url.searchParams.set('query', query);

    const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Sanity query failed (${response.status})`);
    }

    const body = await response.json() as {
        result?: Array<{
            id?: string;
            route?: string;
            name?: string;
            subtitle?: string;
            thumbnailAssetUrl?: string;
        }>;
    };

    const profiles = body.result || [];

    return profiles
        .filter((profile) => Boolean(profile.id && profile.name && (profile.route === 'artist' || profile.route === 'gallery')))
        .map((profile) => ({
            id: profile.id as string,
            route: profile.route as 'artist' | 'gallery',
            name: profile.name as string,
            subtitle: (profile.subtitle || '').trim(),
            thumbnailUrl: normalizeImageUrl(profile.thumbnailAssetUrl || '/logo.png'),
        }));
}

async function resolveMetaProfiles(): Promise<MetaProfile[]> {
    try {
        const sanityProfiles = await fetchSanityMetaProfiles();
        if (sanityProfiles.length > 0) {
            console.log(`Using ${sanityProfiles.length} Sanity profiles for social meta generation.`);
            return sanityProfiles;
        }
    } catch (error) {
        console.warn('Sanity profile fetch failed, skipping artist/gallery social page generation.', error);
    }

    return [];
}

function escapeRegExp(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertMetaTag(
    html: string,
    attr: 'name' | 'property',
    key: string,
    value: string,
) {
    const safeValue = value.replace(/"/g, '&quot;');
    const escapedKey = escapeRegExp(key);
    const targetRegex = new RegExp(`<meta\\s+${attr}="${escapedKey}"\\s+content="[^"]*"\\s*/?>`, 'i');
    const alternateAttr = attr === 'name' ? 'property' : 'name';
    const alternateRegex = new RegExp(`<meta\\s+${alternateAttr}="${escapedKey}"\\s+content="[^"]*"\\s*/?>`, 'i');

    if (targetRegex.test(html)) {
        return html.replace(targetRegex, `<meta ${attr}="${key}" content="${safeValue}" />`);
    }
    if (alternateRegex.test(html)) {
        return html.replace(alternateRegex, `<meta ${attr}="${key}" content="${safeValue}" />`);
    }

    return html.replace('</head>', `  <meta ${attr}="${key}" content="${safeValue}" />\n</head>`);
}

function applyMetaTemplate(
    template: string,
    meta: {
        title: string;
        description: string;
        url: string;
        imageUrl: string;
    },
) {
    let content = template;

    content = content.replace(/<title>.*?<\/title>/, `<title>${meta.title.replace(/"/g, '&quot;')} | CATALOGUE</title>`);
    content = upsertMetaTag(content, 'name', 'description', meta.description);

    content = upsertMetaTag(content, 'property', 'og:type', 'website');
    content = upsertMetaTag(content, 'property', 'og:title', meta.title);
    content = upsertMetaTag(content, 'property', 'og:description', meta.description);
    content = upsertMetaTag(content, 'property', 'og:url', meta.url);
    content = upsertMetaTag(content, 'property', 'og:image', meta.imageUrl);

    content = upsertMetaTag(content, 'name', 'twitter:card', 'summary_large_image');
    content = upsertMetaTag(content, 'name', 'twitter:title', meta.title);
    content = upsertMetaTag(content, 'name', 'twitter:description', meta.description);
    content = upsertMetaTag(content, 'name', 'twitter:url', meta.url);
    content = upsertMetaTag(content, 'name', 'twitter:image', meta.imageUrl);

    return content;
}

function resolveLocalImagePath(imageUrl: string): string | null {
    try {
        const parsed = new URL(imageUrl);
        if (parsed.origin !== SITE_ORIGIN) return null;
        const relativePath = parsed.pathname.replace(/^\//, '');
        const candidatePath = path.join(PUBLIC_DIR, relativePath);
        if (fs.existsSync(candidatePath)) return candidatePath;
        return null;
    } catch {
        return null;
    }
}

async function generateSplitProfileImage(
    profile: MetaProfile,
): Promise<string> {
    const outputFilename = `${profile.route}-${profile.id}.png`;
    const outputPath = path.join(PROFILE_OG_DIR, outputFilename);
    fs.mkdirSync(PROFILE_OG_DIR, { recursive: true });

    const sharpImport = await import('sharp').catch(() => null);
    if (!sharpImport?.default) {
        console.warn('Sharp is unavailable. Falling back to logo-only image for profile OG tags.');
        return `${SITE_ORIGIN}/logo.png`;
    }
    const sharp = sharpImport.default;

    const width = 1200;
    const height = 630;
    const splitX = Math.floor(width / 2);

    const logoPath = fs.existsSync(LOGO_PATH) ? LOGO_PATH : path.join(PUBLIC_DIR, 'favicon.png');
    const logoSource = fs.existsSync(logoPath)
        ? fs.readFileSync(logoPath)
        : await sharp({
            create: { width: 500, height: 500, channels: 4, background: '#ffffff' },
        }).png().toBuffer();

    const leftPane = await sharp(logoSource)
        .resize(splitX, height, {
            fit: 'contain',
            background: '#ffffff',
        })
        .png()
        .toBuffer();

    let rightSourceBuffer: Buffer | null = null;
    const localPath = resolveLocalImagePath(profile.thumbnailUrl);
    if (localPath) {
        rightSourceBuffer = fs.readFileSync(localPath);
    } else {
        try {
            const response = await fetch(profile.thumbnailUrl);
            if (response.ok) {
                const arrBuffer = await response.arrayBuffer();
                rightSourceBuffer = Buffer.from(arrBuffer);
            }
        } catch {
            // ignore and fallback below
        }
    }

    const rightPane = await sharp(rightSourceBuffer || logoSource)
        .resize(width - splitX, height, { fit: 'cover', position: 'attention' })
        .png()
        .toBuffer();

    const divider = await sharp({
        create: { width: 2, height, channels: 4, background: '#e5e5e5' },
    }).png().toBuffer();

    await sharp({
        create: { width, height, channels: 4, background: '#000000' },
    })
        .composite([
            { input: leftPane, left: 0, top: 0 },
            { input: rightPane, left: splitX, top: 0 },
            { input: divider, left: splitX - 1, top: 0 },
        ])
        .png()
        .toFile(outputPath);

    return `${SITE_ORIGIN}/og/profiles/${outputFilename}`;
}

async function generateArticles(template: string) {
    const articles = await resolveMetaArticles();

    for (const article of articles) {
        const articleDir = path.join(DIST_DIR, 'blog', article.id);
        fs.mkdirSync(articleDir, { recursive: true });

        const articleUrl = `${SITE_ORIGIN}/blog/${article.id}`;
        const content = applyMetaTemplate(template, {
            title: article.title,
            description: article.excerpt,
            url: articleUrl,
            imageUrl: article.thumbnailUrl,
        });

        fs.writeFileSync(path.join(articleDir, 'index.html'), content);
        console.log(`Generated article meta: ${article.id}`);
    }

    console.log(`Generated static HTML for ${articles.length} articles.`);
}

async function generateProfiles(template: string) {
    const profiles = await resolveMetaProfiles();
    if (profiles.length === 0) return;

    for (const profile of profiles) {
        const profileDir = path.join(DIST_DIR, profile.route, profile.id);
        fs.mkdirSync(profileDir, { recursive: true });

        const profileUrl = `${SITE_ORIGIN}/${profile.route}/${profile.id}`;
        const imageUrl = await generateSplitProfileImage(profile);
        const description = profile.subtitle
            ? `${profile.subtitle} — view ${profile.name} on CATALOGUE.`
            : `View ${profile.name} on CATALOGUE.`;
        const content = applyMetaTemplate(template, {
            title: profile.name,
            description,
            url: profileUrl,
            imageUrl,
        });

        fs.writeFileSync(path.join(profileDir, 'index.html'), content);
        console.log(`Generated profile meta: ${profile.route}/${profile.id}`);
    }

    console.log(`Generated static HTML and OG images for ${profiles.length} profiles.`);
}

async function generate() {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error('dist/index.html not found. Run build first.');
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    await generateArticles(template);
    await generateProfiles(template);
}

generate().catch(console.error);
