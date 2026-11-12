import { useMemo, useState, useSyncExternalStore } from 'react';
import type { Artist } from './useArtists';
import { createDiscoverySession } from '../lib/discoverySession';
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function useDiscovery(artists: Artist[]) {
    const [session] = useState(() => createDiscoverySession());
    // SSR and its first hydration render agree. Conceal the stage until its client order exists.
    const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
    const ordered = useMemo(() => ready ? session.order(artists) : artists, [ready, session, artists]);
    return { artists: ordered, ready, memory: session.memory, remember: session.remember };
}
