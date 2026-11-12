import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {DispatchSection} from '../components/DispatchSection';
import {DispatchArchive} from '../pages/Dispatch';
import {DispatchMedia} from '../components/DispatchMedia';
import {PublicPageContext} from '../lib/publicPageData';
import {dispatchLink,dispatchMeta,mergeDispatches,safeSourceUrl} from '../lib/dispatch';
import {pageSchema} from '../lib/seo';
import archive from '../data/dispatch-archive.json';
afterEach(cleanup);
it('preserves the selected multi-image editions and story wording without inventing gap editions',()=>{
    expect(archive).toHaveLength(30);
    expect(archive.reduce((n,p)=>n+p.items.length,0)).toBe(164);
    expect(archive.some(p=>p.slug==='2026-10-11'||p.slug==='2026-11-08')).toBe(false);
    for(const p of archive){
        const reconstructed=p.title+'\n\n'+p.items.map(item=>`${String(item.number).padStart(2,'0')} · ${item.headline}${item.body?' '+item.body:''}`).join('\n\n');
        expect(reconstructed.trim()).toBe(p.body.trim());
    }
});
it('prefers Sanity corrections by date and excludes drafts/future editions',()=>{
    const original=archive[0];
    const posts=mergeDispatches([{...original,id:'live',summary:'Corrected'},{...original,id:'drafts.hidden',summary:'Secret'},{...original,id:'future',slug:'2099-01-01',publishedAt:'2099-01-01T00:00:00Z'}],Date.parse('2026-11-12'));
    expect(posts).toHaveLength(30);expect(posts[0].summary).toBe('Corrected');
});
it('links the landing issue to the local reading page, independently of Content Lab',()=>{
    render(<MemoryRouter><PublicPageContext.Provider value={{artists:[],articles:[],editorial:null,dispatches:[archive[0]]}}><DispatchSection/></PublicPageContext.Provider></MemoryRouter>);
    expect(screen.getByRole('link',{name:'Read the edition: Wed, Nov 11, 2026'})).toHaveAttribute('href','/dispatch/2026-11-11/');
});
it('searches the complete archive text',()=>{
    render(<MemoryRouter><PublicPageContext.Provider value={{artists:[],articles:[],editorial:null,dispatches:archive}}><DispatchArchive/></PublicPageContext.Provider></MemoryRouter>);
    fireEvent.change(screen.getByRole('searchbox'),{target:{value:'centre pivot'}});
    expect(screen.getByText('1 editions')).toBeInTheDocument();
});
it('makes all four issue images independently available for expansion',()=>{
    render(<DispatchMedia post={archive[0]}/>);
    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(screen.getAllByRole('button',{name:/Expand/})).toHaveLength(4);
});
it('uses dispatch breadcrumbs and the actual cover for sharing',()=>{
    const meta=dispatchMeta(archive[0]);expect(meta.image).toBe(archive[0].coverUrl);
    expect(JSON.stringify(pageSchema(meta))).toContain('https://catalogue.gallery/dispatch/');
    expect(JSON.stringify(pageSchema(meta))).not.toContain('/blog/');
});
it('rejects executable or unrelated outbound URLs',()=>{
    expect(dispatchLink('javascript:alert(1)')).toBeUndefined();
    expect(dispatchLink('https://x.com.example.org/post')).toBeUndefined();
    expect(safeSourceUrl('data:text/html,bad')).toBeUndefined();
});
