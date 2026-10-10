import { afterEach, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { StrictMode, Suspense } from 'react';
import { Seo } from '../components/Seo';
import { applyPageMeta, articleMeta, staticPages } from '../lib/seo';
afterEach(() => { cleanup(); document.head.querySelectorAll('[data-rh]').forEach(node => node.remove()); });
it('adopts server metadata and replaces every article identity tag on home and directory navigation', async () => {
    const article = articleMeta({ id: 'story', title: 'A story', excerpt: 'The story description.' });
    const html = applyPageMeta('<html><head></head><body></body></html>', article);
    const initial = new DOMParser().parseFromString(html, 'text/html');
    for (const node of Array.from(initial.head.children)) document.head.appendChild(node.cloneNode(true));
    const { rerender } = render(<StrictMode><Seo meta={article} /></StrictMode>);
    await waitFor(() => expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1));
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(article.description);
    rerender(<StrictMode><Seo meta={staticPages[0]} /></StrictMode>);
    expect(document.title).toBe(staticPages[0].title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(staticPages[0].description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://catalogue.gallery/');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    expect(document.querySelector('meta[name="twitter:url"]')?.getAttribute('content')).toBe('https://catalogue.gallery/');
    rerender(<StrictMode><Seo meta={staticPages[1]} /></StrictMode>);
    await waitFor(() => expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(staticPages[1].description));
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://catalogue.gallery/artists/');
    expect(document.title).toBe(staticPages[1].title);
});

it('does not let an abandoned suspended article render change the committed page metadata', () => {
    const pending = new Promise<void>(() => {});
    function PendingBody(): never { throw pending; }
    const article = articleMeta({ id: 'pending', title: 'Uncommitted article', excerpt: 'Must never replace the home metadata.' });
    const { rerender } = render(<Seo meta={staticPages[0]} />);
    rerender(<Suspense fallback={<p>Loading</p>}><Seo meta={article} /><PendingBody /></Suspense>);
    expect(document.title).toBe(staticPages[0].title);
    rerender(<Seo meta={staticPages[1]} />);
    expect(document.title).toBe(staticPages[1].title);
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
});
