import { publicPageData, renderPublicDocument } from '../_lib/renderPublic';
import { dispatchMeta } from '../../src/lib/dispatch';
import { publicDispatches } from '../_lib/publicDispatch';
import { cachedPublicResponse, missingResponse, unavailableResponse, pageResponse, slashRedirect, type PageEnv } from '../_lib/seoResponse';
const renderIssue = async ({request, env, params}: {request: Request; env: PageEnv; params: Record<string,string|string[]>}) => {
    try {
        const dispatches = await publicDispatches(env);
        const post = dispatches.find(post => post.slug === String(params.slug));
        if (!post) return missingResponse(request, env);
        const redirect = slashRedirect(request); if (redirect) return redirect;
        const data = {...await publicPageData(env), dispatches};
        return pageResponse(request, env, dispatchMeta(post), 200, html => renderPublicDocument(html, new URL(request.url).pathname, data));
    } catch { return unavailableResponse(request, env); }
};
export const onRequestGet = (context: Parameters<typeof renderIssue>[0]) => cachedPublicResponse(context.request, () => renderIssue(context), context.env);
export const onRequestHead = onRequestGet;
