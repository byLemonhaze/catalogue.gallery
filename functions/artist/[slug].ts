import { profilePage } from '../_lib/profilePage';
import { cachedPublicResponse, type PageEnv } from '../_lib/seoResponse';
export const onRequestGet = ({ request, env, params }: { request: Request; env: PageEnv; params: Record<string, string | string[]> }) => cachedPublicResponse(request, () => profilePage(request, env, String(params.slug), 'artist'), env);
export const onRequestHead = onRequestGet;
