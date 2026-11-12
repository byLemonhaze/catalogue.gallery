// Post-deployment smoke check. Reads public pages only; never submits forms or publishes content.
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const origin = 'https://catalogue.gallery';
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const get = (url, redirect = 'follow') => fetch(url, {redirect, signal:AbortSignal.timeout(20000), headers:{'Cache-Control':'no-cache'}});
const story = 'experimental-television-center-owego-paik-abe';
for (const [from,to] of [['/blog/','/stories/'],[`/blog/${story}/`,`/stories/${story}/`],['/info/','/about/']]) {
    const response = await get(origin + from + '?release-check=1', 'manual');
    check(response.status === 301, `${from}: expected 301, received ${response.status}`);
    check(response.headers.get('location') === origin + to + '?release-check=1', `${from}: incorrect redirect destination`);
    await response.body?.cancel();
}
const local = new JSDOM(await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8'));
const expectedScript = local.window.document.querySelector('script[type=module][src]')?.getAttribute('src');
check(Boolean(expectedScript), 'Missing local build entry');
local.window.close();
for (const route of ['/','/stories/',`/stories/${story}/`,'/about/','/artists/','/dispatch/','/dispatch/2026-11-11/','/artist/lemonhaze/','/artist/lemonhaze/world/']) {
    const response = await get(origin+route);
    check(response.status === 200, `${route}: HTTP ${response.status}`);
    const doc = new JSDOM(await response.text());
    const head = doc.window.document;
    const canonical = origin + (route.endsWith('/world/') ? route.replace(/world\/$/,'') : route);
    check(head.querySelector('link[rel=canonical]')?.href === canonical,`${route}: wrong canonical`);
    for (const key of ['og:title','og:description','og:image','twitter:card','twitter:image']) {
        const tags = head.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`);
        check(tags.length === 1 && Boolean(tags[0]?.getAttribute('content')),`${route}: missing/duplicate ${key}`);
    }
    check(head.querySelector('meta[property="og:image"]')?.content === head.querySelector('meta[name="twitter:image"]')?.content,`${route}: preview image mismatch`);
    check(head.querySelector('script[type=module][src]')?.getAttribute('src') === expectedScript,`${route}: production does not serve the local build entry`);
    doc.window.close();
}
const icon = await get(origin+'/brand/favicon-constellation.svg');
check(icon.ok && (await icon.text()).includes('<svg'), 'Constellation SVG icon unavailable');
const report = {checkedAt:new Date().toISOString(),expectedScript,failures};
await fs.writeFile(new URL('../dist/production-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length) process.exitCode=1;
