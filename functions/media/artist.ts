/** Same-origin texture delivery, restricted to this project's public Sanity images. */
export const onRequestGet = async ({ request }: { request: Request }): Promise<Response> => {
    const url = new URL(request.url);
    const asset = url.searchParams.get('asset') || '';
    const width = url.searchParams.get('w') || '900';
    if (!/^[a-f0-9]+-\d+x\d+\.(jpg|jpeg|png|webp|gif|avif)$/.test(asset) || !['450', '900', '1200'].includes(width)) return new Response('Invalid image', { status: 400 });
    const upstream = await fetch(`https://cdn.sanity.io/images/ebj9kqfo/production/${asset}?w=${width}&q=80&auto=format`);
    if (!upstream.ok) return new Response('Image unavailable', { status: upstream.status });
    const type = upstream.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return new Response('Invalid image response', { status: 502 });
    return new Response(upstream.body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400, s-maxage=604800', 'X-Content-Type-Options': 'nosniff' } });
};
