import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ArtistFrame } from '../pages/ArtistFrame';
const state = vi.hoisted(() => ({ artists: [] as { id: string; name: string; websiteUrl: string; subtitle: string; thumbnail: null }[], loading: true, error: null as string | null }));
vi.mock('../hooks/useArtists', () => ({ useArtists: () => state }));
function setup(id = 'test') {
    return render(<HelmetProvider><MemoryRouter initialEntries={[`/artist/${id}/`]}><Routes><Route path="/artist/:id/" element={<ArtistFrame />} /></Routes></MemoryRouter></HelmetProvider>);
}
function seed(id = 'test') {
    const script = document.createElement('script'); script.id = 'catalogue-profile'; script.type = 'application/json';
    script.textContent = JSON.stringify({ id, type: 'artist', name: 'Test artist', websiteUrl: 'https://example.com/' }); document.head.appendChild(script);
}
beforeEach(() => { state.artists = []; state.loading = true; state.error = null; });
afterEach(() => { cleanup(); document.getElementById('catalogue-profile')?.remove(); vi.useRealTimers(); });
it('opens the bootstrap website while the directory is still loading', () => {
    seed(); setup(); expect(screen.getByTitle('Test artist Website')).toHaveAttribute('src', 'https://example.com/');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Exit Artist Universe' })).toHaveAttribute('href', '/');
});
it.each(['burst', 'far', 'nullish'])('keeps only Exit without creating a blocked iframe for %s', id => {
    seed(id); const { container } = setup(id); expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('heading', { name: 'This website cannot be displayed here.' })).toBeVisible();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Exit Artist Universe' })).toHaveAttribute('href', '/');
});
it('replaces the spinner with a nonblocking slow-load message and removes it on load', () => {
    vi.useFakeTimers(); seed(); setup(); act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText('This website is taking a little longer to load.')).toBeVisible();
    fireEvent.load(screen.getByTitle('Test artist Website')); expect(screen.queryByText(/taking a little longer/)).not.toBeInTheDocument();
});
it('rejects a bootstrap for a different route and presents a missing-profile state', () => {
    seed('another'); state.loading = false; const { container } = setup();
    expect(container.querySelector('iframe')).toBeNull(); expect(screen.getByText('This profile is not available.')).toBeVisible();
});
