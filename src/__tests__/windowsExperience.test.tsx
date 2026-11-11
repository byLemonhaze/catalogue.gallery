import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppContent } from '../App';
import { PublicPageContext, type PublicPageData } from '../lib/publicPageData';
const data: PublicPageData = { artists: [{ id: 'test-artist', type: 'artist', name: 'Test Artist', subtitle: 'Digital art', shortBio: 'An approved short biography.', websiteUrl: 'https://artist.example/', thumbnail: null }, { id: 'other-artist', type: 'artist', name: 'Other Artist', subtitle: 'Painting', websiteUrl: 'https://other.example/', thumbnail: null }], articles: [], editorial: null };
function LocationProbe() { const location = useLocation(); return <output data-testid="route">{location.pathname}</output>; }
function setup(path = '/') { return render(<HelmetProvider><PublicPageContext.Provider value={data}><MemoryRouter initialEntries={[path]}><AppContent /><LocationProbe /></MemoryRouter></PublicPageContext.Provider></HelmetProvider>); }
beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('keeps discovery mounted through profile and world, then returns to its original route', async () => {
    setup();
    const carousel = screen.getByRole('region', { name: 'Discover artist worlds' });
    fireEvent.click(screen.getByRole('link', { name: 'View Test Artist' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('An approved short biography.')).toBeInTheDocument();
    expect(screen.getByTestId('route')).toHaveTextContent('/artist/test-artist/');
    expect(document.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Enter world' }));
    await screen.findByTitle('Test Artist Website');
    expect(carousel).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Exit Artist Universe' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Close artist profile' }));
    expect(screen.getByTestId('route').textContent).toBe('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Discover artist worlds' })).toBe(carousel);
    expect(screen.getByRole('link', {name:'View Test Artist'})).toHaveFocus();
});
it('provides a standalone profile on direct entry and never embeds before consent to enter', () => {
    setup('/artist/test-artist/');
    expect(screen.getByRole('heading', { name: 'Test Artist' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('link', { name: 'Enter world' })).toHaveAttribute('href', '/artist/test-artist/world/');
});
it('closes the profile with Escape cancellation and restores the opening link focus', async () => {
    setup();
    const link = screen.getByRole('link', { name: 'View Test Artist' });
    link.focus();
    fireEvent.click(link);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(link).toHaveFocus();
});
it('searches the complete directory without requiring carousel interaction', async () => {
    setup('/artists/');
    const input = await screen.findByRole('searchbox', { name: 'Search directory' });
    fireEvent.change(input, { target: { value: 'Other' } });
    expect(screen.getByRole('heading', { name: 'Other Artist' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Test Artist' })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'No such artist' } });
    expect(screen.getByText(/No matching profiles/)).toBeInTheDocument();
});
it('exposes search on standalone profile pages', () => {
    setup('/artist/test-artist/');
    fireEvent.click(screen.getByRole('button', { name: 'Search artists and stories' }));
    expect(screen.getByRole('dialog', { name: 'Find a world. Or a story.' })).toBeInTheDocument();
});
