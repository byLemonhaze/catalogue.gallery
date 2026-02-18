import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { articles as legacyArticles } from '../src/data/articles';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

type MetaArticle = {
    id: string;
    title: string;
    excerpt: string;
    thumbnailUrl: string;
};

function normalizeImageUrl(input: string | undefined) {
    if (!input) return 'https://catalogue.gallery/logo.png';
    if (/^https?:\/\//i.test(input)) return input;
    return `https://catalogue.gallery${input.startsWith('/') ? input : `/${input}`}`;
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
      | order(coalesce(sortOrder, 999999) asc, coalesce(publishedAt, _createdAt) desc) {
        "id": slug.current,
        title,
        excerpt,
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
            thumbnailUrl: normalizeImageUrl(post.thumbnailAssetUrl || post.thumbnailPath || '/logo.png'),
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

async function generate() {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error('dist/index.html not found. Run build first.');
        // We don't exit with error here because in some CI/CD it might run before build in a chain, 
        // but here we are in postbuild so it should exist.
        process.exit(1);
    }

    const articles = await resolveMetaArticles();
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    for (const article of articles) {
        // Create directory structure: dist/articles/[id]
        const articleDir = path.join(DIST_DIR, 'blog', article.id);
        fs.mkdirSync(articleDir, { recursive: true });

        let content = template;

        // Helper to replace meta tags safely
        // Improved to handle either name or property to be safe
        const replaceMetaTag = (attrName: string, attrValue: string, newContent: string) => {
            // Try replacing property="attrValue"
            let regex = new RegExp(`<meta property="${attrValue}" content="[^"]*" />`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, `<meta property="${attrValue}" content="${newContent}" />`);
                return;
            }

            // Try replacing name="attrValue"
            regex = new RegExp(`<meta name="${attrValue}" content="[^"]*" />`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, `<meta name="${attrValue}" content="${newContent}" />`);
                return;
            }

            // If neither found, maybe append? For now, we assume index.html has the skeletons.
            console.warn(`Warning: Could not find meta tag for ${attrValue}`);
        };


        // 1. Title
        content = content.replace(/<title>.*?<\/title>/, `<title>${article.title} | CATALOGUE</title>`);

        // 2. Open Graph Tags
        const safeExcerpt = article.excerpt.replace(/"/g, '&quot;');
        const safeTitle = article.title.replace(/"/g, '&quot;');
        const articleUrl = `https://catalogue.gallery/blog/${article.id}`;

        replaceMetaTag('property', 'og:title', safeTitle);
        replaceMetaTag('property', 'og:description', safeExcerpt);
        replaceMetaTag('property', 'og:url', articleUrl);
        // Set og:image to article thumbnail
        const imageUrl = article.thumbnailUrl;
        replaceMetaTag('property', 'og:image', imageUrl);


        // 3. Twitter Tags
        replaceMetaTag('name', 'twitter:title', safeTitle);
        replaceMetaTag('name', 'twitter:description', safeExcerpt);
        // Handle twitter:url which might be 'property' in source
        replaceMetaTag('name', 'twitter:url', articleUrl);

        // Ensure twitter:image is present/consistent
        replaceMetaTag('name', 'twitter:image', imageUrl);


        // 4. Standard Description
        replaceMetaTag('name', 'description', safeExcerpt);

        // Write index.html
        fs.writeFileSync(path.join(articleDir, 'index.html'), content);
        console.log(`Generated meta for: ${article.id}`);
    }

    console.log(`\nGenerated static HTML for ${articles.length} articles.`);
}

generate().catch(console.error);
