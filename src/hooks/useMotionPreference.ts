import { useSyncExternalStore } from 'react';
let override: boolean | null = null;
const listeners = new Set<() => void>();
const snapshot = () => override ?? (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
function subscribe(listener: () => void) {
    listeners.add(listener);
    const preference = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    preference?.addEventListener('change', listener);
    return () => { listeners.delete(listener); preference?.removeEventListener('change', listener); };
}
export function useMotionPreference() {
    const reduced = useSyncExternalStore(subscribe, snapshot, () => false);
    return [reduced, () => { override = !snapshot(); listeners.forEach(listener => listener()); }] as const;
}
