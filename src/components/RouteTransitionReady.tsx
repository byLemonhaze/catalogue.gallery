import {useLayoutEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';
import {useMotionPreference} from '../hooks/useMotionPreference';
import {isPageOpening, pageTransitionReady} from '../lib/pageOpening';

/** Inside Suspense: the destination, rather than the loading fallback, is captured. */
export function RouteTransitionReady() {
    const location = useLocation();
    const previous = useRef(location.key);
    const [reduced] = useMotionPreference();
    useLayoutEffect(() => {
        pageTransitionReady(location.pathname);
        const changed = previous.current !== location.key;
        previous.current = location.key;
        if (!changed || isPageOpening() || /^\/(artist|gallery)\//.test(location.pathname)) return;
        const surface = document.querySelector<HTMLElement>('.route-transition-surface');
        if (!surface?.animate) return;
        // Back/forward, unsupported browsers and reduced motion have a quiet arrival.
        const animation = surface.animate(reduced ? [{opacity:.8},{opacity:1}] : [{opacity:.6,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:reduced ? 120 : 240,easing:'ease-out'});
        return () => animation.cancel();
    }, [location.key, location.pathname, reduced]);
    return null;
}
