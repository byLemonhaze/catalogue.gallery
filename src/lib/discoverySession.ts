import type { Artist } from '../hooks/useArtists';

export type DiscoveryMemory = { artistId?: string; offset: number; paused: boolean };
/** One document's discovery. Never shared across SSR requests or stored across refreshes. */
export function createDiscoverySession(random = Math.random) {
    let ids: string[] = [];
    const memory: DiscoveryMemory = { offset: 0, paused: false };
    return {
        memory,
        remember(next: DiscoveryMemory) { Object.assign(memory, next); },
        order(artists: Artist[]) {
            const available = new Map(artists.map(artist => [artist.id, artist]));
            ids = ids.filter(id => available.has(id));
            const known = new Set(ids);
            const additions = artists.filter(artist => !known.has(artist.id)).map(artist => artist.id);
            for (let i = additions.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [additions[i], additions[j]] = [additions[j], additions[i]];
            }
            ids.push(...additions);
            return ids.map(id => available.get(id)!);
        },
    };
}
export function restoreDiscoveryPosition(artists: Artist[], memory?: DiscoveryMemory) {
    const index = artists.findIndex(artist => artist.id === memory?.artistId);
    return index < 0 ? 0 : index + (memory?.offset || 0);
}
