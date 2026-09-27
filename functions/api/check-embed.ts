import { normalizeWebsiteUrl } from '../../shared/submission';
import { checkEmbedding } from './_embedCheck';

export const onRequestGet = async ({ request }: { request: Request }) => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    let url: string;
    try {
        url = normalizeWebsiteUrl(new URL(request.url).searchParams.get('url') || '');
    } catch {
        return new Response(JSON.stringify({ error: 'Enter a valid public HTTPS website URL.' }), { status: 400, headers });
    }
    return new Response(JSON.stringify(await checkEmbedding(url)), { headers });
};
