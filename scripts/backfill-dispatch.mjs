/** Historical import is dry-run by default. Writes drafts only, never publishes. */
import fs from 'node:fs';
import {createClient} from '@sanity/client';
const issues = JSON.parse(fs.readFileSync(new URL('../src/data/dispatch-archive.json',import.meta.url),'utf8'));
const write = process.argv.includes('--write-drafts');
if (!write) {
    console.log(JSON.stringify({mode:'dry-run',editions:issues.length,images:issues.reduce((n,p)=>n+(p.coverUrl?1:0)+(p.plates?.length||0),0),ids:issues.map(p=>`drafts.${p.id}`)},null,2));
} else {
    if (!process.env.SANITY_API_TOKEN) throw new Error('SANITY_API_TOKEN is required; nothing was written.');
    const client = createClient({projectId:process.env.SANITY_PROJECT_ID||'ebj9kqfo',dataset:process.env.SANITY_DATASET||'production',apiVersion:'2024-01-01',useCdn:false,token:process.env.SANITY_API_TOKEN});
    const upload = async (url,alt,key) => {
        const source = new URL(url);
        if (source.protocol!=='https:' || source.hostname!=='pbs.twimg.com' || !source.pathname.startsWith('/media/')) throw new Error('Unexpected archive media host');
        const response = await fetch(source,{signal:AbortSignal.timeout(30000),redirect:'error'});
        if(!response.ok) throw new Error(`Image unavailable: ${response.status}`);
        const contentType=response.headers.get('content-type')||'';
        if(!contentType.startsWith('image/')) throw new Error('Archive asset is not an image');
        const asset=await client.assets.upload('image',Buffer.from(await response.arrayBuffer()),{filename:key,contentType});
        return {_type:'image',_key:key,asset:{_type:'reference',_ref:asset._id},alt,sourceUrl:url};
    };
    for(const post of issues) {
        const existing=await client.fetch('*[_id in $ids]._id',{ids:[post.id,`drafts.${post.id}`]},{perspective:'raw'});
        if(existing.length){console.log(`Skipped existing ${post.id}`);continue;}
        const cover=await upload(post.coverUrl,post.coverAlt,`${post.slug}-cover`);
        const plates=[];
        for(const [index,plate] of post.plates.entries()) plates.push(await upload(plate.url,plate.alt,`${post.slug}-plate-${index+1}`));
        await client.createIfNotExists({_id:`drafts.${post.id}`,_type:'dispatch',title:post.title,slug:{_type:'slug',current:post.slug},issueDate:post.issueDate,dateDisplay:post.dateDisplay,publishedAt:post.publishedAt,dek:post.summary,body:post.body,archiveSource:'x',xPostUrl:post.xUrl,cover,plates,items:post.items.map(item=>{ const fields={...item}; const plateUrl=fields.plateUrl; delete fields.plateUrl; delete fields.plateAlt; delete fields.plateSourceUrl; const plateIndex=post.plates.findIndex(plate=>plate.url===plateUrl); return {...fields,_type:'dispatchItem',_key:`story-${item.number}`,...(plateIndex>=0?{plate:plates[plateIndex]}:{})}; })});
        console.log(`Created draft ${post.id}`);
    }
}
