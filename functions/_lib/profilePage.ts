import { profileMeta, profileBootstrapHtml } from '../../src/lib/seo';
import { profileFilter, profileProjection, queryPublic, validProfile, type PublicProfile } from './publicContent';
import { pageResponse, missingResponse, unavailableResponse, slashRedirect, type PageEnv } from './seoResponse';
export async function profilePage(request: Request, env: PageEnv, slug: string, type: 'artist' | 'gallery') {
    try {
        const profiles = await queryPublic<PublicProfile[]>(`*[${profileFilter} && coalesce(slug.current, _id) == $slug] ${profileProjection}`, env, { slug });
        if (!Array.isArray(profiles) || !profiles.every(validProfile)) throw new Error('Invalid public profile');
        const profile = profiles.find(item => item.type === type);
        if (!profile) {
            if (profiles.length === 1) {
                const url = new URL(request.url); url.pathname = `/${profiles[0].type}/${encodeURIComponent(slug)}/`;
                return Response.redirect(url.href, 301);
            }
            return missingResponse(request, env);
        }
        const redirect = slashRedirect(request); if (redirect) return redirect;
        // Existing branded images remain usable; newly published profiles use their CMS thumbnail.
        let image = profile.thumbnailUrl;
        const imagePath = `/og/profiles/${profile.type}-${encodeURIComponent(profile.id)}.png`;
        const imageResponse = await env.ASSETS.fetch(new Request(new URL(imagePath, request.url), { method: 'HEAD' }));
        if (imageResponse.ok && imageResponse.headers.get('Content-Type')?.startsWith('image/')) image = imagePath;
        const meta = profileMeta({ ...profile, image });
        return pageResponse(request, env, meta, 200, html => profileBootstrapHtml(html, { ...profile, seoImageUrl: image }));
    } catch { return unavailableResponse(request, env); }
}
