// Compatibility adapter for the homepage transcript and its route-ready signal.
import {openPage, pageTransitionReady} from './pageOpening';
export function dispatchIssueReady(slug: string | undefined) {
    if (slug) pageTransitionReady(`/dispatch/${slug}/`);
}
export function openDispatchIssue(source: HTMLElement, slug: string, navigate: () => void, reduced: boolean) {
    openPage(source, `/dispatch/${slug}/`, navigate, reduced);
}
