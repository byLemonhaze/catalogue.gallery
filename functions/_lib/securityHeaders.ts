// Report-only while we verify artist embeds and third-party services in browsers.
// Violations stay in the browser console; no visitor URLs are uploaded.
export const FRAME_ANCESTORS_CSP = "frame-ancestors 'self' https://dax27.xyz";
export const REPORT_ONLY_CSP = "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https://*.sanity.io https://cloudflareinsights.com; frame-src https:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; " + FRAME_ANCESTORS_CSP;

export function withSecurityHeaders(response: Response): Response {
    // Clone because redirects and upstream responses can have immutable headers.
    const secured = new Response(response.body, response);
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    // X-Frame-Options cannot express the studio exception. Remove inherited
    // values (including older cached responses) and enforce the exact allowlist.
    secured.headers.delete('X-Frame-Options');
    secured.headers.set('Content-Security-Policy', FRAME_ANCESTORS_CSP);
    secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    secured.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    if (secured.headers.get('Content-Type')?.toLowerCase().includes('text/html')) {
        secured.headers.set('Content-Security-Policy-Report-Only', REPORT_ONLY_CSP);
    }
    return secured;
}
