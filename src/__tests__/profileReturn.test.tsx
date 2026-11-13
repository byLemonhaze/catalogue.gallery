import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppContent } from '../App';
import { PublicPageContext, type PublicPageData } from '../lib/publicPageData';
import { createProfileVortex } from '../lib/profileVortex';
vi.mock('../lib/profileVortex', () => ({ createProfileVortex: vi.fn(() => null) }));
vi.mock('../lib/windowWarp', () => ({ createWindowWarp: () => null }));
const data: PublicPageData = {
    artists: [
        { id: 'test', type: 'artist', name: 'Test Artist', subtitle: '', websiteUrl: 'https://artist.example/', thumbnail: '/portrait.jpg' },
        { id: 'other', type: 'artist', name: 'Other Artist', subtitle: '', websiteUrl: 'https://other.example/', thumbnail: '/other.jpg' },
        { id: 'space', type: 'gallery', name: 'Test Gallery', subtitle: '', websiteUrl: 'https://gallery.example/', thumbnail: '/gallery.jpg' },
    ], articles: [], editorial: null,
};
function HistoryControls() {
    const navigate = useNavigate();
    return <><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button><button onClick={() => navigate('/artist/other/')}>Other profile</button></>;
}
function setup(path = '/') {
    return render(<HelmetProvider><PublicPageContext.Provider value={data}><MemoryRouter initialEntries={[path]}><AppContent /><HistoryControls /></MemoryRouter></PublicPageContext.Provider></HelmetProvider>);
}
async function preview(name: string, restored: boolean) {
    if (restored) {
        expect(await screen.findByRole('img', { name })).toBeVisible();
        await act(async () => { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); });
        expect(screen.queryByTitle(`${name} website preview`)).not.toBeInTheDocument();
        expect(document.querySelector('.profile-portal')).toBeNull();
    } else {
        await screen.findByTitle(`${name} website preview`);
        expect(document.querySelector('.profile-portal canvas')).not.toBeNull();
    }
}
beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(.999999);
    vi.stubGlobal('WebGLRenderingContext', class {});
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.mocked(createProfileVortex).mockClear(); });
it('restores the profile image after Exit world but plays the vortex on a fresh catalogue opening', async () => {
    setup();
    fireEvent.click(screen.getByRole('link', { name: 'View Test Artist' }));
    await preview('Test Artist', false);
    expect(createProfileVortex).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('link', { name: 'Enter world' }));
    await screen.findByTitle('Test Artist Website');
    fireEvent.click(screen.getByRole('link', { name: 'Exit Artist Universe' }));
    await screen.findByRole('dialog');
    await preview('Test Artist', true);
    expect(createProfileVortex).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('link', { name: 'Enter Test Artist’s world' }));
    await screen.findByTitle('Test Artist Website');
    fireEvent.click(screen.getByRole('link', { name: 'Exit Artist Universe' }));
    await preview('Test Artist', true);
    expect(createProfileVortex).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close artist profile' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('link', { name: 'View Test Artist' }));
    await preview('Test Artist', false);
    expect(createProfileVortex).toHaveBeenCalledTimes(2);
});
it.each([['artist/test','Test Artist'], ['gallery/space','Test Gallery']])('restores %s through browser Back and repeated Forward/Back visits', async (path, name) => {
    setup(`/${path}/`);
    await preview(name, false);
    fireEvent.click(screen.getByRole('link', { name: 'Enter world' }));
    await screen.findByTitle(`${name} Website`);
    for (let visit = 0; visit < 2; visit++) {
        fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
        await preview(name, true);
        expect(createProfileVortex).toHaveBeenCalledTimes(1);
        if (visit === 0) {
            fireEvent.click(screen.getByRole('button', { name: 'Browser forward' }));
            await screen.findByTitle(`${name} Website`);
        }
    }
});
it('does not replay a vortex when exiting a directly opened world', async () => {
    setup('/artist/test/world/');
    await screen.findByTitle('Test Artist Website');
    fireEvent.click(screen.getByRole('link', { name: 'Exit Artist Universe' }));
    await preview('Test Artist', true);
    expect(createProfileVortex).not.toHaveBeenCalled();
});
it('still animates a different artist opened from a world', async () => {
    setup('/artist/test/world/');
    await screen.findByTitle('Test Artist Website');
    fireEvent.click(screen.getByRole('button', { name: 'Other profile' }));
    await preview('Other Artist', false);
    expect(createProfileVortex).toHaveBeenCalledTimes(1);
});
