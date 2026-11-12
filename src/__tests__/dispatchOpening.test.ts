import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {dispatchIssueReady, openDispatchIssue} from '../lib/dispatchOpening';

const original = Object.getOwnPropertyDescriptor(document, 'startViewTransition');
let source: HTMLAnchorElement;
beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    source = document.createElement('a');
    source.innerHTML = '<time>November 11</time>';
    document.body.append(source);
});
afterEach(() => {
    source.remove();
    if (original) Object.defineProperty(document, 'startViewTransition', original);
    else Reflect.deleteProperty(document, 'startViewTransition');
    vi.useRealTimers(); vi.restoreAllMocks();
});
function nativeTransition() {
    let update!: () => Promise<void>;
    let finish!: () => void;
    const finished = new Promise<void>(resolve => {finish = resolve;});
    const skipTransition = vi.fn(finish);
    const start = vi.fn((callback: () => Promise<void>) => {
        update = callback;
        return {ready: Promise.resolve(), finished, skipTransition};
    });
    Object.defineProperty(document, 'startViewTransition', {configurable:true, value:start});
    return {start, skipTransition, update:()=>update(), finish:async()=>{finish(); await finished;}};
}
it('navigates immediately without the API and respects reduced motion with the API', () => {
    Object.defineProperty(document, 'startViewTransition', {configurable:true,value:undefined});
    const navigate = vi.fn();
    openDispatchIssue(source, 'day', navigate, false);
    const native = nativeTransition();
    openDispatchIssue(source, 'day', navigate, true);
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(native.start).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.dispatchOpening).toBeUndefined();
});
it('waits for the matching lazy edition, ignores duplicate activation and clears transient styles', async () => {
    const native = nativeTransition(); const navigate = vi.fn();
    openDispatchIssue(source, 'day', navigate, false);
    openDispatchIssue(source, 'day', navigate, false);
    expect(native.start).toHaveBeenCalledTimes(1);
    const arrived = vi.fn(); const update = native.update().then(arrived);
    expect(navigate).toHaveBeenCalledTimes(1);
    dispatchIssueReady('other'); await Promise.resolve();
    expect(arrived).not.toHaveBeenCalled();
    dispatchIssueReady('day'); await update;
    expect(arrived).toHaveBeenCalledOnce();
    await native.finish();
    expect(document.documentElement.dataset.dispatchOpening).toBeUndefined();
    expect(source.querySelector('time')?.style.viewTransitionName).toBe('');
    expect(document.documentElement.style.getPropertyValue('--dispatch-slit-top')).toBe('');
});
it('releases the captured view if the route is too slow or cannot render', async () => {
    const native = nativeTransition(); const navigate = vi.fn();
    openDispatchIssue(source, 'day', navigate, false);
    const update = native.update();
    await vi.advanceTimersByTimeAsync(900); await update;
    expect(native.skipTransition).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.dispatchOpening).toBeUndefined();
});
it('still navigates if the browser refuses to start a transition', () => {
    Object.defineProperty(document, 'startViewTransition', {configurable:true,value:()=>{throw new Error('unavailable');}});
    const navigate = vi.fn();
    openDispatchIssue(source, 'day', navigate, false);
    expect(navigate).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.dispatchOpening).toBeUndefined();
});
