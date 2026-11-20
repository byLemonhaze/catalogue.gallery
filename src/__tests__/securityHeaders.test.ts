import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FRAME_ANCESTORS_CSP, REPORT_ONLY_CSP, withSecurityHeaders } from '../../functions/_lib/securityHeaders';

it('adds report-only protection without changing page content or cache policy', async () => {
    const result = withSecurityHeaders(new Response('<p>Artist</p>', { headers: { 'content-type': 'text/html', 'cache-control': 'public, max-age=300' } }));
    expect(result.headers.get('content-security-policy')).toBe("frame-ancestors 'self' https://dax27.xyz");
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

it('replaces inherited same-origin-only framing restrictions with the studio allowlist', () => {
    const result = withSecurityHeaders(new Response('<p>Cached page</p>', { headers: {
        'content-type': 'text/html', 'x-frame-options': 'SAMEORIGIN',
        'content-security-policy': "frame-ancestors 'self'",
    } }));
    expect(result.headers.get('x-frame-options')).toBeNull();
    expect(result.headers.get('content-security-policy')).toBe("frame-ancestors 'self' https://dax27.xyz");
    expect(result.headers.get('content-security-policy-report-only')).toContain(FRAME_ANCESTORS_CSP);
});

it('keeps the static fallback and Functions embedding policies identical', () => {
    const fallback = readFileSync('public/_headers', 'utf8');
    expect(fallback).toContain(`  Content-Security-Policy: ${FRAME_ANCESTORS_CSP}\n`);
    expect(fallback).toContain(`  Content-Security-Policy-Report-Only: ${REPORT_ONLY_CSP}\n`);
    expect(fallback.toLowerCase()).not.toContain('x-frame-options');
});
