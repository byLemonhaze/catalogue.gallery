import type { Artist } from '../hooks/useArtists';
export function parseProfileBootstrap(value: unknown, id: string, route: string): Artist | null {
    if (!value || typeof value !== 'object') return null;
    const profile = value as Record<string, unknown>;
    if (profile.id !== id || profile.type !== route || typeof profile.name !== 'string' || typeof profile.websiteUrl !== 'string') return null;
    try { if (new URL(profile.websiteUrl).protocol !== 'https:') return null; } catch { return null; }
    return { id, name: profile.name, subtitle: typeof profile.subtitle === 'string' ? profile.subtitle : '', websiteUrl: profile.websiteUrl,
        thumbnail: null, type: route === 'gallery' ? 'gallery' : 'artist',
        desktopExitPosition: ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left'].includes(String(profile.desktopExitPosition)) ? profile.desktopExitPosition as Artist['desktopExitPosition'] : undefined,
        mobileExitPosition: ['bottom-center', 'top-right', 'top-left', 'top-center'].includes(String(profile.mobileExitPosition)) ? profile.mobileExitPosition as Artist['mobileExitPosition'] : undefined };
}
export function readProfileBootstrap(id: string, route: string) {
    try { return parseProfileBootstrap(JSON.parse(document.getElementById('catalogue-profile')?.textContent || 'null'), id, route); } catch { return null; }
}
// Header restrictions reported in the performance audit; keep this override small and reviewable.
// Public directory data is not modified by this local fallback.
export const externalOnlyProfiles = new Set(['burst', 'far', 'nullish']);
