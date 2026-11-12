import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppContent } from '../App';
import { PublicPageContext, type PublicPageData } from '../lib/publicPageData';
import { matchesDispatch } from '../lib/dispatch';
import archive from '../data/dispatch-archive.json';

const data: PublicPageData = {
    artists: [
        { id: 'ada', name: 'Ada Artist', subtitle: 'Generative art', type: 'artist', websiteUrl: 'https://artist.example', thumbnail: null },
        { id: 'space', name: 'Independent Space', subtitle: 'Curated gallery', type: 'gallery', websiteUrl: 'https://gallery.example', thumbnail: null },
        { id: 'burst', name: 'Burst', subtitle: 'Digital artist', type: 'artist', websiteUrl: 'https://burst.example', thumbnail: null },
    ],
    articles: [{ id: 'studio-visit', title: 'A studio visit', excerpt: 'Behind the artwork', content: 'A conversation.', author: 'CATALOGUE', date: '2026-11-11', type: 'Interview', thumbnailUrl: 'https://images.example/story.png', source: 'sanity' }],
    editorial: null,
    dispatches: [archive[0]],
};
function Probe() { const location = useLocation(); return <output data-testid="route">{location.pathname}</output>; }
function setup(path = '/') {
    render(<HelmetProvider><PublicPageContext.Provider value={data}><MemoryRouter initialEntries={[path]}><AppContent/><Probe/></MemoryRouter></PublicPageContext.Provider></HelmetProvider>);
}
beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('PointerEvent', MouseEvent);
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each([
    ['Ada Artist', 'Ada Artist Generative art', '/artist/ada/', true],
    ['Independent Space', 'Independent Space Curated gallery', '/gallery/space/', true],
    ['studio visit', 'A studio visit', '/blog/studio-visit/', false],
    ['2026-11-11', /DISPATCH.*Nov 11/, '/dispatch/2026-11-11/', false],
] as const)('searches %s through the keyboard shortcut and opens the correct surface', async (query, name, route, profile) => {
    setup();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = screen.getByRole('searchbox', { name: 'Search artists, galleries, stories and DISPATCH' });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: query } });
    const result = screen.getByRole('link', { name });
    expect(result).toHaveAttribute('href', route);
    fireEvent.click(result);
    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent(route));
    expect(screen.queryByRole('dialog', { name: 'Search' })).not.toBeInTheDocument();
    if (profile) expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
});
it('normalizes dates and whitespace in archive search without modifying edition data', () => {
    const before = JSON.stringify(archive[0]);
    expect(matchesDispatch(archive[0], ' 2026-11-11 ')).toBe(true);
    expect(matchesDispatch(archive[0], 'CENTRE PIVOT')).toBe(true);
    expect(matchesDispatch(archive[0], 'no such topic')).toBe(false);
    expect(JSON.stringify(archive[0])).toBe(before);
});
it('shows a quiet zero-results state and treats whitespace as an empty query', () => {
    setup();
    fireEvent.keyDown(window, { key: 'K', ctrlKey: true });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-such-result' } });
    expect(screen.getByText('No matches. Try another name, topic or edition date.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '   ' } });
    expect(screen.queryByRole('region', { name: 'DISPATCH editions' })).not.toBeInTheDocument();
    expect(screen.getByText('Artists, galleries, Content Lab stories and daily DISPATCH editions.')).toBeInTheDocument();
});
it('resets directory query and type together from an empty result', async () => {
    setup('/artists/');
    const input = await screen.findByRole('searchbox', { name: 'Search directory' });
    fireEvent.click(screen.getByRole('button', { name: 'Galleries' }));
    fireEvent.change(input, { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset search and filters' }));
    expect(input).toHaveValue('');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Ada Artist' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Independent Space' })).toBeInTheDocument();
});
it('sets expectations for blocked sites before world entry and retains safe-area position metadata', async () => {
    setup('/artist/burst/');
    expect(screen.getByText(/Its owner does not allow embedded viewing/)).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Enter world' }));
    const controls = await screen.findByRole('navigation', { name: 'Artist website controls' });
    expect(controls).toHaveAttribute('data-mobile-position', 'bottom-center');
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('link', { name: 'Exit Artist Universe' })).toBeInTheDocument();
});
it('yields vertical and ambiguous drags, captures horizontal intent and suppresses accidental profile entry', () => {
    setup();
    const stage = document.querySelector('.windows-stage') as HTMLElement;
    const capture = vi.fn(); stage.setPointerCapture = capture;
    fireEvent.pointerDown(stage, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { clientX: 105, clientY: 140 });
    fireEvent.pointerMove(stage, { clientX: 210, clientY: 145 });
    expect(capture).not.toHaveBeenCalled();
    fireEvent.pointerUp(stage);
    fireEvent.pointerDown(stage, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { clientX: 122, clientY: 120 });
    expect(capture).not.toHaveBeenCalled();
    fireEvent.pointerMove(stage, { clientX: 170, clientY: 125 });
    expect(capture).toHaveBeenCalledOnce();
    fireEvent.pointerUp(stage);
    fireEvent.click(screen.getByRole('link', { name: 'View Ada Artist' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('route').textContent).toBe('/');
});
it('keeps explicit pause/resume and a readable current position available', () => {
    setup();
    expect(screen.getByLabelText('Artist 1 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: 'View all artists' })).toHaveAttribute('href', '/artists/');
});
