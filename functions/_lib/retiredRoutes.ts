/** Block retired editor URLs before any static fallback or API handler runs. */
export function retiredRouteResponse(request: Request): Response | null {
    const path = new URL(request.url).pathname;
    if (!/^\/content-lab(?:\/|$)/i.test(path) && !/^\/api\/content-/i.test(path)) return null;
    return new Response(request.method === 'HEAD' ? null : 'This endpoint has been permanently removed.', {
        status: 410,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
}
