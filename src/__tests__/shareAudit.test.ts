import {it, expect} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {applyPageMeta, staticPages, articleMeta} from '../lib/seo';

it('audits generated page metadata and fails when a local share image is missing', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'catalogue-share-audit-'));
    try {
        const pages = [...staticPages.filter(page => !page.noindex), articleMeta({id:'example',title:'Example story',excerpt:'A description'})];
        await fs.mkdir(path.join(dir,'brand'), {recursive:true});
        await fs.copyFile('public/brand/catalogue-social-constellation.png',path.join(dir,'brand/catalogue-social-constellation.png'));
        for (const page of pages) {
            const folder = path.join(dir,page.path);
            await fs.mkdir(folder,{recursive:true});
            await fs.writeFile(path.join(folder,'index.html'),applyPageMeta('<html><head></head><body></body></html>',page));
        }
        await fs.writeFile(path.join(dir,'seo-manifest.json'),JSON.stringify({paths:pages.map(page=>page.path)}));
        const run = () => spawnSync(process.execPath,['scripts/audit-share-previews.mjs','--dir',dir],{encoding:'utf8'});
        const valid = run();
        expect(valid.status,valid.stderr+valid.stdout).toBe(0);
        expect(JSON.parse(valid.stdout).pages).toBe(pages.length);
        await fs.unlink(path.join(dir,'brand/catalogue-social-constellation.png'));
        const invalid = run();
        expect(invalid.status).toBe(1);
        expect(JSON.parse(invalid.stdout).failures[0]).toContain('invalid local image');
    } finally { await fs.rm(dir,{recursive:true,force:true}); }
},15000);
