import type { Artist } from '../hooks/useArtists';
export type DirectoryOrder = 'az' | 'za' | 'newest' | 'shuffle';
export function sortDirectory(artists: Artist[], order: DirectoryOrder, shuffledIds: string[] = []) {
    const rank = new Map(shuffledIds.map((id, index) => [id, index]));
    const byName = (a: Artist, b: Artist) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id);
    return [...artists].sort((a, b) => {
        if (order === 'za') return -byName(a,b);
        if (order === 'newest') return (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0) || byName(a,b);
        if (order === 'shuffle') return (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || byName(a,b);
        return byName(a,b);
    });
}
export function shuffleDirectory(artists: Artist[], random = Math.random) {
    const ids = artists.map(artist => artist.id);
    for(let i=ids.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [ids[i],ids[j]]=[ids[j],ids[i]]; }
    return ids;
}
