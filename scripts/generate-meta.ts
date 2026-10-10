import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyPageMeta, staticPages, profileMeta, articleMeta, missingMeta, profileBootstrapHtml, sitemapXml, SITE_ORIGIN, type PageMeta } from '../src/lib/seo';
import { publicInventory } from '../functions/_lib/publicContent';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const PROFILE_OG_DIR = path.join(DIST_DIR, 'og', 'profiles');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'logo.png');
type MetaProfile = { id: string; route: string; thumbnailUrl: string };
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
            const response = await fetch(profile.thumbnailUrl, { signal: AbortSignal.timeout(15000) });
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

async function generate() {
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const { profiles, articles } = await publicInventory(process.env);
    if (!profiles.length || !articles.length) throw new Error('Refusing to build an empty public content inventory');
    const entries = [...staticPages.filter(page => !page.noindex), ...profiles.map(profile => ({ path: profileMeta(profile).path, updatedAt: profile.updatedAt })), ...articles.map(article => ({ path: articleMeta(article).path, updatedAt: article.updatedAt }))];
    // Validate uniqueness before writing anything. Failure must stop the deployment.
    const sitemap = sitemapXml(entries);
    function writePage(meta: PageMeta, transform?: (html: string) => string) {
        const segments = meta.path.split('/').filter(Boolean);
        if (segments.some(segment => !/^[a-zA-Z0-9_%.-]+$/.test(segment) || ['.', '..'].includes(segment))) throw new Error(`Unsafe output path: ${meta.path}`);
        const directory = path.join(DIST_DIR, ...segments);
        fs.mkdirSync(directory, { recursive: true });
        const html = applyPageMeta(template, meta);
        fs.writeFileSync(path.join(directory, 'index.html'), transform ? transform(html) : html);
    }
    for (const page of staticPages) writePage(page);
    for (const article of articles) writePage(articleMeta(article));
    async function writeProfile(profile: (typeof profiles)[number]) {
        // Keep the existing branded share-card assets; image failures must not remove a page.
        let image = profile.thumbnailUrl;
        try { image = await generateSplitProfileImage({ id: profile.id, route: profile.type, thumbnailUrl: profile.thumbnailUrl || `${SITE_ORIGIN}/logo.png` }); }
        catch (error) { console.warn(`Using original thumbnail for ${profile.id}:`, error); }
        writePage(profileMeta({ ...profile, image }), html => profileBootstrapHtml(html, { ...profile, seoImageUrl: image }));
    }
    const queue = [...profiles];
    await Promise.all(Array.from({ length: 4 }, async () => {
        let profile;
        while ((profile = queue.shift())) await writeProfile(profile);
    }));
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
    // A top-level 404 disables Cloudflare Pages' implicit successful SPA fallback.
    fs.writeFileSync(path.join(DIST_DIR, '404.html'), applyPageMeta(template, missingMeta('/404/')));
    fs.writeFileSync(path.join(DIST_DIR, 'seo-manifest.json'), JSON.stringify({ profiles: profiles.length, articles: articles.length, paths: entries.map(entry => entry.path) }, null, 2));
    console.log(`Generated SEO pages for ${profiles.length} profiles, ${articles.length} articles and ${staticPages.length} static routes.`);
}
generate().catch(error => { console.error(error); process.exitCode = 1; });
