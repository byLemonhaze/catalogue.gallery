import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { DispatchThumbnail } from '../components/DispatchThumbnail';
import { DispatchMedia } from '../components/DispatchMedia';
import { EditorialImage } from '../components/ContentLabSection';
import { DispatchIssue } from '../pages/Dispatch';
import { PublicPageContext } from '../lib/publicPageData';
import type { ArticleRecord } from '../types/article';
import archive from '../data/dispatch-archive.json';

const injection = 'https://images.example/art?caption="><script>alert(1)</script>';
const post = { ...archive[0], coverUrl: injection, plates: [], items: [] };
const article: ArticleRecord = { id: 'test', title: 'Test', author: 'Test', date: '', type: 'Article', excerpt: '', content: '', thumbnailUrl: injection, source: 'sanity' };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function expectLiteralImage(container: HTMLElement) {
    expect(container.querySelector('img')?.getAttribute('src')).toContain('https://images.example/');
    expect(container.querySelector('img')?.getAttribute('src')).not.toContain('<script>');
    expect(container.querySelector('script, [onerror], [onload]')).toBeNull();
}

it('keeps a Dispatch thumbnail URL in its image attribute, without parsing markup', () => {
    expectLiteralImage(render(<DispatchThumbnail post={post} />).container);
});

it('keeps contact-sheet and expanded image URLs as attributes', () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    const { container, getByRole } = render(<DispatchMedia post={post} />);
    expectLiteralImage(container);
    fireEvent.click(getByRole('button', { name: 'Expand cover' }));
    expect(container.querySelector('dialog img')?.getAttribute('src')).toContain('https://images.example/');
    expect(container.querySelector('script, [onerror], [onload]')).toBeNull();
});

it('keeps an editorial image URL as an attribute without introducing handlers', () => {
    expectLiteralImage(render(<EditorialImage article={article} />).container);
});

it.each(['javascript:alert(123456)', 'data:text/html,<script>alert(1)</script>', '//attacker.example/image', 'https://user:password@images.example/image', '/\\attacker.example/image'])('rejects unsafe image URL %s before rendering', payload => {
    const { container } = render(<><DispatchThumbnail post={{ ...post, coverUrl: payload }} /><EditorialImage article={{ ...article, thumbnailUrl: payload }} /></>);
    expect(container.querySelectorAll('.dispatch-cover img')).toHaveLength(0);
    expect(container.querySelector('img')).toHaveAttribute('src', '/logo.png');
});

it('keeps even malformed runtime story numbers inside a fixed fragment link', () => {
    const malformed = 'javascript:alert(1)" onclick="alert(2)';
    const issue = { ...post, coverUrl: null, items: [{ number: malformed as unknown as number, headline: 'Test headline', body: 'Test body', plateUrl: injection }] };
    const { container } = render(<HelmetProvider><MemoryRouter initialEntries={[`/dispatch/${post.slug}/`]}><PublicPageContext.Provider value={{ artists: [], articles: [], editorial: null, dispatches: [issue] }}><Routes><Route path="/dispatch/:slug/" element={<DispatchIssue />} /></Routes></PublicPageContext.Provider></MemoryRouter></HelmetProvider>);
    const anchor = container.querySelector('nav[aria-label="In this edition"] a');
    expect(anchor?.getAttribute('href')).toBe(`#story-${malformed}`);
    expect(anchor).not.toHaveAttribute('onclick');
    expect(container.querySelector('.dispatch-story img')?.getAttribute('src')).toContain('https://images.example/');
    expect(container.querySelector('[onclick], [onerror], .dispatch-story script')).toBeNull();
    expect(new URL(anchor!.getAttribute('href')!, 'https://catalogue.gallery/').origin).toBe('https://catalogue.gallery');
});
