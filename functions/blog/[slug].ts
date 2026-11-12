// Compatibility for already published links; new pages are served under /stories/.
import {publicPath} from '../../src/lib/publicRoutes';
import {canonicalPath} from '../../src/lib/seo';
export function onRequestGet({request}: {request: Request}) {
    const url = new URL(request.url);
    url.pathname = canonicalPath(publicPath(url.pathname));
    return Response.redirect(url.href,301);
}
export const onRequestHead = onRequestGet;
