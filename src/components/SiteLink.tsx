import {forwardRef} from 'react';
import {Link as RouterLink, useLocation, useNavigate, useResolvedPath, type LinkProps} from 'react-router-dom';
import {useMotionPreference} from '../hooks/useMotionPreference';
import {openPage} from '../lib/pageOpening';
import {publicPath} from '../lib/publicRoutes';

/** Normal links retain their URL/state semantics; artist portals keep their own motion. */
export const SiteLink = forwardRef<HTMLAnchorElement, LinkProps>(function SiteLink(props, ref) {
    const {to: originalTo, onClick, target, download, reloadDocument, replace, state, relative, preventScrollReset, ...rest} = props;
    const to = typeof originalTo === 'string' ? publicPath(originalTo.replace(/^https:\/\/catalogue\.gallery(?=\/)/, '')) : {...originalTo, pathname: originalTo.pathname ? publicPath(originalTo.pathname) : undefined};
    const location = useLocation();
    const resolved = useResolvedPath(to, {relative});
    const navigate = useNavigate();
    const [reduced] = useMotionPreference();
    return <RouterLink {...rest} ref={ref} to={to} target={target} download={download} reloadDocument={reloadDocument}
        replace={replace} state={state} relative={relative} preventScrollReset={preventScrollReset}
        onClick={event => {
            onClick?.(event);
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || download != null || reloadDocument || (target && target !== '_self')) return;
            const url = new URL(event.currentTarget.href, window.location.href);
            if (url.origin !== window.location.origin || /^\/(artist|gallery)\//.test(resolved.pathname) || /\/world\/?$/.test(location.pathname)) return;
            // Hash jumps, filters, and reselecting the current route remain immediate.
            if (resolved.pathname.replace(/\/$/,'') === location.pathname.replace(/\/$/,'')) return;
            event.preventDefault();
            openPage(event.currentTarget, resolved.pathname, () => navigate(to, {replace, state, relative, preventScrollReset}), reduced);
        }} />;
});
