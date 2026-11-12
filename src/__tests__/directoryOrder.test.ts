import {expect,it} from 'vitest';
import {shuffleDirectory,sortDirectory} from '../lib/directoryOrder';
import type {Artist} from '../hooks/useArtists';
const artists=[{id:'z',name:'Zoë',createdAt:'2026-01-01'},{id:'a',name:'Álvaro',createdAt:'2026-02-01'},{id:'b',name:'Bart',createdAt:'invalid'}] as Artist[];
it('sorts names with accents and puts unknown addition dates last without mutating the input',()=>{
    expect(sortDirectory(artists,'az').map(a=>a.id)).toEqual(['a','b','z']);
    expect(sortDirectory(artists,'za').map(a=>a.id)).toEqual(['z','b','a']);
    expect(sortDirectory(artists,'newest').map(a=>a.id)).toEqual(['a','z','b']);
    expect(artists[0].id).toBe('z');
});
it('preserves shuffle rank through filters and rerenders without losing artists',()=>{
    const ids=shuffleDirectory(artists,()=>0);
    expect(new Set(ids)).toEqual(new Set(['a','b','z']));
    expect(sortDirectory(artists,'shuffle',ids).map(a=>a.id)).toEqual(ids);
    expect(sortDirectory(artists.filter(a=>a.id!=='b'),'shuffle',ids).map(a=>a.id)).toEqual(ids.filter(id=>id!=='b'));
});
