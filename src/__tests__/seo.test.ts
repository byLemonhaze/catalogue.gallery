import { describe, expect, it } from 'vitest';
import { applyPageMeta, articleMeta, canonicalUrl, profileBootstrapHtml, sitemapXml, staticPages } from '../lib/seo';
const template = '<html><head><title>Old</title><meta name="description" content="old"><meta property="twitter:card" content="summary"><link rel="canonical" href="https://wrong.test/"><meta name="viewport" content="width=device-width"></head><body><div id="root"></div></body></html>';
describe('SEO document generation', () => {
    it('replaces conflicting server tags with a single adoptable head and safely escapes content', () => {
        const meta = articleMeta({ id: 'art', title: 'Art <script> & "ideas"', excerpt: 'A "quote" & more' });
        const first = applyPageMeta(template, meta);
        const second = applyPageMeta(first, staticPages[1]);
        const doc = new DOMParser().parseFromString(first, 'text/html');
        expect(doc.title).toBe('Art <script> & "ideas" | CATALOGUE');
        expect(doc.querySelectorAll('meta[name="description"]')).toHaveLength(1);
        expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(meta.description);
        expect(doc.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('article');
        expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
        expect(doc.querySelectorAll('script')).toHaveLength(1);
        expect(doc.querySelector('script')?.type).toBe('application/ld+json');
        expect(JSON.parse(doc.querySelector('script')!.textContent!)['@graph'].some((item: Record<string, string>) => item.headline === 'Art <script> & "ideas"')).toBe(true);
        expect(doc.querySelector('meta[name="viewport"]')).not.toBeNull();
        const next = new DOMParser().parseFromString(second, 'text/html');
        expect(next.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(staticPages[1].description);
        expect(next.querySelectorAll('meta[name="twitter:card"]')).toHaveLength(1);
        expect(next.querySelector('meta[property="twitter:card"]')).toBeNull();
        expect(next.querySelector('meta[name="description"]')?.getAttribute('data-rh')).toBe('true');
    });
    it('uses production canonicals without tracking parameters or fragments', () => {
        expect(canonicalUrl('/artist/test?utm_source=x#art')).toBe('https://catalogue.gallery/artist/test/');
        expect(canonicalUrl('/')).toBe('https://catalogue.gallery/');
    });
    it('encodes bootstrap data without allowing it to close the script', () => {
        const html = profileBootstrapHtml(template, { id: 'test', type: 'artist', name: '</script><script>bad()</script>', websiteUrl: 'https://example.com' });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        expect(doc.querySelectorAll('script')).toHaveLength(1);
        expect(JSON.parse(doc.querySelector('script')!.textContent!).name).toBe('</script><script>bad()</script>');
    });
    it('generates valid XML, preserves modification dates and rejects duplicate canonicals', () => {
        const xml = sitemapXml([{ path: '/artist/a&b/', updatedAt: '2026-10-10T12:00:00Z' }, { path: '/' }]);
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        expect(doc.querySelector('parsererror')).toBeNull();
        expect(doc.querySelector('loc')?.textContent).toBe('https://catalogue.gallery/artist/a&b/');
        expect(doc.querySelectorAll('lastmod')).toHaveLength(1);
        expect(() => sitemapXml([{ path: '/a/' }, { path: '/a' }])).toThrow('Duplicate');
    });
});
