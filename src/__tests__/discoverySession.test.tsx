import {act, cleanup, render, screen, fireEvent} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {useState} from 'react';
import {useDiscovery} from '../hooks/useDiscovery';
import {createDiscoverySession, restoreDiscoveryPosition} from '../lib/discoverySession';
import type {Artist} from '../hooks/useArtists';
const artists: Artist[] = ['a','b','c','d'].map(id=>({id,name:id,subtitle:'',websiteUrl:`https://${id}.example`,thumbnail:null}));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('shuffles a new document once and preserves order across renders and payload updates',()=>{
    const random = vi.fn(()=>0);
    const session = createDiscoverySession(random);
    const order = session.order(artists).map(a=>a.id);
    expect(order).not.toEqual(artists.map(a=>a.id));
    expect(new Set(order).size).toBe(4);
    expect(session.order([...artists]).map(a=>a.id)).toEqual(order);
    expect(random).toHaveBeenCalledTimes(3);
    const added = {...artists[0],id:'e'};
    expect(session.order([...artists,added]).map(a=>a.id)).toEqual([...order,'e']);
    expect(session.order(artists.filter(a=>a.id!==order[0])).map(a=>a.id)).toEqual(order.slice(1));
    expect(createDiscoverySession(()=>.999).order(artists).map(a=>a.id)).not.toEqual(order);
});
it('restores the selected ID, fractional position and pause even if the inventory order changes',()=>{
    const session=createDiscoverySession();
    session.remember({artistId:'c',offset:-.2,paused:true});
    expect(restoreDiscoveryPosition(artists,session.memory)).toBe(1.8);
    expect(restoreDiscoveryPosition([...artists].reverse(),session.memory)).toBe(.8);
    expect(restoreDiscoveryPosition(artists.filter(a=>a.id!=='c'),session.memory)).toBe(0);
    expect(session.memory.paused).toBe(true);
});
function Harness() {
    const discovery=useDiscovery(artists);
    const [home,setHome]=useState(true);
    return <><button onClick={()=>setHome(value=>!value)}>Navigate</button><div data-testid="stage" data-ready={discovery.ready}>{home ? discovery.artists.map(a=>a.id).join(',') : 'Other page'}</div></>;
}
it('returns to the same order after internal navigation',()=>{
    vi.spyOn(Math,'random').mockReturnValue(0);
    render(<Harness/>);
    const order=screen.getByTestId('stage').textContent;
    fireEvent.click(screen.getByRole('button')); fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('stage')).toHaveTextContent(order!);
});
it('keeps SSR and hydration identical before making the fresh client order visible',async()=>{
    vi.spyOn(Math,'random').mockReturnValue(0);
    const server=renderToString(<Harness/>);
    expect(server).toContain('data-ready="false"');
    expect(server).toContain('a,b,c,d');
    const element=document.createElement('div'); document.body.append(element);element.innerHTML=server;
    const recover=vi.fn(); let root!: ReturnType<typeof hydrateRoot>;
    await act(async()=>{root=hydrateRoot(element,<Harness/>,{onRecoverableError:recover});});
    expect(recover).not.toHaveBeenCalled();
    expect(element.querySelector('[data-ready="true"]')?.textContent).toBe('b,c,d,a');
    await act(async()=>root.unmount());element.remove();
});
