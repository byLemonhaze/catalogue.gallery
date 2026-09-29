import { Component, type ReactNode } from 'react';
let artistModule: ReturnType<typeof importArtist> | undefined;
function importArtist() { return import('../pages/ArtistFrame').then(module => ({ default: module.ArtistFrame })); }
export function loadArtistFrame() {
    artistModule ??= importArtist().catch(error => { artistModule = undefined; throw error; });
    return artistModule;
}
export function prefetchArtistFrame() {
    let timer = 0;
    let idle = 0;
    const schedule = () => {
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
        if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType || '')) return;
        if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => { void loadArtistFrame().catch(() => {}); });
        else timer = window.setTimeout(() => { void loadArtistFrame().catch(() => {}); }, 1500);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => { window.removeEventListener('load', schedule); clearTimeout(timer); if (idle) window.cancelIdleCallback(idle); };
}
export function isChunkError(error: unknown) {
    return error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically imported module/i.test(error.message);
}
export function mayReload(previous: string | null, now: number) {
    return !previous || !Number.isFinite(Number(previous)) || now - Number(previous) > 60000;
}
export async function recoverImport<T>(loader: () => Promise<T>): Promise<T> {
    try { return await loader(); } catch (error) {
        if (isChunkError(error)) {
            try {
                const key = 'catalogue:chunk-reload';
                if (mayReload(sessionStorage.getItem(key), Date.now())) {
                    sessionStorage.setItem(key, String(Date.now()));
                    window.location.reload();
                    return await new Promise<T>(() => {});
                }
            } catch { /* Storage may be unavailable; show the recovery UI instead. */ }
        }
        throw error;
    }
}
export class RouteRecoveryBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (!this.state.failed) return this.props.children;
        return <div className="min-h-screen grid place-items-center px-6"><div className="text-center max-w-md"><h1 className="text-2xl">This page could not load.</h1><p className="my-5 text-white/60">Check your connection, then reload to get the latest version of CATALOGUE.</p><button className="border border-white/30 px-5 py-3" onClick={() => window.location.reload()}>Reload page</button></div></div>;
    }
}
