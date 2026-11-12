import { flushSync } from 'react-dom';

let awaitingIssue: { path: string; ready: () => void } | null = null;
let opening = false;

/** Resolve only when the lazy issue route has actually committed, never on a loader. */
const cleanPath = (path: string) => path.replace(/\/+$/, '') || '/';
export function pageTransitionReady(path: string) {
    if (awaitingIssue && awaitingIssue.path === cleanPath(path)) awaitingIssue.ready();
}
export function isPageOpening() { return opening; }
export type OpeningKind = 'page' | 'story' | 'dispatch';
export function openingKind(path: string): OpeningKind {
    return /^\/dispatch\/[^/]+/.test(path) ? 'dispatch' : /^\/stories\/[^/]+/.test(path) ? 'story' : 'page';
}

export function openPage(source: HTMLElement, path: string, navigate: () => void, reduced: boolean) {
    if (opening) return;
    if (!document.startViewTransition || reduced) {
        navigate();
        return;
    }
    opening = true;
    const kind = openingKind(path);
    const root = document.documentElement;
    const rect = source.getBoundingClientRect();
    const y = Math.max(2, Math.min(innerHeight - 2, rect.top + rect.height / 2));
    root.style.setProperty('--dispatch-slit-top', `${y - 1}px`);
    root.style.setProperty('--dispatch-slit-bottom', `${innerHeight - y - 1}px`);
    root.style.setProperty('--dispatch-slit-left', `${Math.max(0, rect.left)}px`);
    root.style.setProperty('--dispatch-slit-right', `${Math.max(0, innerWidth - rect.right)}px`);
    root.dataset.pageOpening = kind;
    if (kind === 'dispatch') root.dataset.dispatchOpening = 'true';
    const date = kind === 'dispatch' ? source.querySelector('time') : null;
    if (date) date.style.viewTransitionName = 'dispatch-date';
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
        clearTimeout(timeout);
        awaitingIssue = null;
        opening = false;
        delete root.dataset.dispatchOpening;
        delete root.dataset.pageOpening;
        if (date) date.style.removeProperty('view-transition-name');
        ['top', 'bottom', 'left', 'right'].forEach(side => root.style.removeProperty(`--dispatch-slit-${side}`));
    };
    try {
        const transition = document.startViewTransition(() => new Promise<void>(resolve => {
            awaitingIssue = { path: cleanPath(path), ready: () => { clearTimeout(timeout); resolve(); } };
            // Slow imports/errors must never leave a frozen snapshot over the app.
            timeout = setTimeout(() => { transition.skipTransition(); resolve(); }, 900);
            flushSync(navigate);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }));
        void transition.ready.catch(() => {});
        void transition.finished.then(cleanup, cleanup);
    } catch {
        cleanup();
        navigate();
    }
}
