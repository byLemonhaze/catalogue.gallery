// Run after the complete SEO build. --remote additionally GET-checks each unique remote image.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directoryArg = process.argv.indexOf('--dir');
const dist = directoryArg < 0 ? path.join(root, 'dist') : path.resolve(process.argv[directoryArg + 1]);
const origin = 'https://catalogue.gallery';
const manifest = JSON.parse(await fs.readFile(path.join(dist, 'seo-manifest.json'), 'utf8'));
const failures = [];
const images = new Map();
for (const route of manifest.paths) {
    const filename = path.join(dist, route, 'index.html');
    const dom = new JSDOM(await fs.readFile(filename, 'utf8'));
    const doc = dom.window.document;
    const read = (key) => {
        const tags = doc.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`);
        if (tags.length !== 1 || !tags[0]?.content?.trim()) failures.push(`${route}: missing/duplicate ${key}`);
        return tags[0]?.content || '';
    };
    for (const key of ['og:title','og:description','og:image:alt','twitter:title','twitter:description','twitter:image:alt','twitter:site']) read(key);
    const image = read('og:image');
    if (image !== read('twitter:image')) failures.push(`${route}: OG/Twitter image mismatch`);
    if (read('twitter:card') !== 'summary_large_image') failures.push(`${route}: wrong Twitter card`);
    const canonical = doc.querySelector('link[rel=canonical]')?.href;
    if (canonical !== origin + route || read('og:url') !== canonical || read('twitter:url') !== canonical) failures.push(`${route}: canonical/share URL mismatch`);
    try {
        const url = new URL(image);
        if (!['https:','http:'].includes(url.protocol)) throw new Error('unsupported scheme');
        const routes = images.get(url.href) || []; routes.push(route); images.set(url.href, routes);
    } catch { failures.push(`${route}: image must be an absolute HTTP(S) URL`); }
    dom.window.close();
}
let localImages = 0;
const remote = [];
for (const [image, routes] of images) {
    const url = new URL(image);
    if (url.origin !== origin) { remote.push(image); continue; }
    localImages++;
    const file = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
    try {
        if (path.relative(dist, file).startsWith('..')) throw new Error('invalid path');
        const metadata = await sharp(file).metadata();
        if (!metadata.width || !metadata.height || metadata.format === 'svg') throw new Error('missing raster preview');
    } catch (error) { failures.push(`${routes.join(', ')}: invalid local image ${url.pathname}: ${error.message}`); }
}
let remoteChecked = 0;
if (process.argv.includes('--remote')) {
    const queue = [...remote];
    await Promise.all(Array.from({length:4},async()=>{
        let image;
        while ((image = queue.shift())) {
            try {
                const response = await fetch(image, {headers:{Range:'bytes=0-1023'},signal:AbortSignal.timeout(10000)});
                if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) failures.push(`Remote image failed: ${image} (${response.status})`);
                await response.body?.cancel(); remoteChecked++;
            } catch(error) { failures.push(`Remote image unavailable: ${image}: ${error.message}`); }
        }
    }));
}
const report = {checkedAt:new Date().toISOString(),pages:manifest.paths.length,localImages,remoteImages:remote.length,remoteChecked,failures};
await fs.writeFile(path.join(dist,'share-preview-audit.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length) process.exitCode=1;
