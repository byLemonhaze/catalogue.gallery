import { expect, it } from 'vitest';
import { withSecurityHeaders } from '../../functions/_lib/securityHeaders';

it('adds report-only protection without changing page content or cache policy', async () => {
    const result = withSecurityHeaders(new Response('<p>Artist</p>', { headers: { 'content-type': 'text/html', 'cache-control': 'public, max-age=300' } }));
    expect(result.headers.get('content-security-policy')).toBeNull();
    expect(result.headers.get('content-security-policy-report-only')).toContain('frame-src https:');
    expect(result.headers.get('permissions-policy')).toContain('camera=()');
    expect(result.headers.get('cache-control')).toBe('public, max-age=300');
    expect(await result.text()).toBe('<p>Artist</p>');
});

it('preserves immutable redirect responses and does not apply a document policy to APIs', () => {
    const result = withSecurityHeaders(Response.redirect('https://catalogue.gallery/', 301));
    expect(result.status).toBe(301);
    expect(result.headers.get('location')).toBe('https://catalogue.gallery/');
    const api = withSecurityHeaders(Response.json({ ok: true }));
    expect(api.headers.get('content-security-policy-report-only')).toBeNull();
    expect(api.headers.get('x-content-type-options')).toBe('nosniff');
});
