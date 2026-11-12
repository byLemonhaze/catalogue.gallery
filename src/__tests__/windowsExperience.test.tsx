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
    vi.spyOn(Math, 'random').mockReturnValue(.999999);
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
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
it('provides a standalone profile and explicit entry when no preview image is available', () => {
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
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
});
it('captures vertical wheel input over the stage but preserves browser zoom gestures', () => {
    setup();
    const stage = document.querySelector('.windows-stage')!;
    const wheel = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
    fireEvent(stage, wheel);
    expect(wheel.defaultPrevented).toBe(true);
    const zoom = new WheelEvent('wheel', { deltaY: 120, ctrlKey: true, bubbles: true, cancelable: true });
    fireEvent(stage, zoom);
    expect(zoom.defaultPrevented).toBe(false);
});
it('enters the artist website on the second image click and returns to the same profile', async () => {
    setup();
    fireEvent.click(screen.getByRole('link', {name:'View Test Artist'}));
    fireEvent.click(screen.getByRole('link', {name:'Enter Test Artist’s world'}));
    await screen.findByTitle('Test Artist Website');
    expect(screen.getByTestId('route')).toHaveTextContent('/artist/test-artist/world/');
    fireEvent.click(screen.getByRole('link', {name:'Exit Artist Universe'}));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
});
it('treats the opened profile card text as an entrance without requiring the explicit CTA', async () => {
    setup();
    fireEvent.click(screen.getByRole('link', {name:'View Test Artist'}));
    fireEvent.click(screen.getByRole('heading', {name:'Test Artist'}));
    await screen.findByTitle('Test Artist Website');
    expect(screen.getByTestId('route')).toHaveTextContent('/artist/test-artist/world/');
});
it('moves one whole artist with arrow keys from the page and scrubber, preserving focus', async () => {
    setup();
    vi.spyOn(document.querySelector('.windows-stage')!, 'getBoundingClientRect').mockReturnValue({top:100,bottom:600,left:0,right:1000,width:1000,height:500,x:0,y:100,toJSON:()=>({})});
    const selected = () => document.querySelector('.selected-artist')?.textContent;
    expect(selected()).toBe('Test Artist');
    fireEvent.keyDown(document.body, {key:'ArrowRight'});
    await waitFor(() => expect(selected()).toBe('Other Artist'));
    const slider = screen.getByRole('slider', {name:'Choose artist'});
    slider.focus();
    fireEvent.keyDown(slider, {key:'ArrowLeft'});
    await waitFor(() => expect(selected()).toBe('Test Artist'));
    expect(slider).toHaveFocus();
    fireEvent.keyDown(slider, {key:'ArrowLeft'});
    await waitFor(() => expect(selected()).toBe('Other Artist'));
});
it('does not intercept arrows in search or an open profile', () => {
    setup();
    fireEvent.click(screen.getByRole('button', {name:'Search artists and stories'}));
    const input = screen.getByRole('searchbox');
    const arrow = new KeyboardEvent('keydown', {key:'ArrowRight',bubbles:true,cancelable:true});
    fireEvent(input,arrow);
    expect(arrow.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole('button', {name:'Close search'}));
    fireEvent.click(screen.getByRole('link', {name:'View Test Artist'}));
    const modalArrow = new KeyboardEvent('keydown', {key:'ArrowLeft',bubbles:true,cancelable:true});
    fireEvent(screen.getByRole('dialog'),modalArrow);
    expect(modalArrow.defaultPrevented).toBe(false);
});
it('opens the branded policy dialog, closes with Escape and restores its opener',()=>{
    setup();
    const opener=screen.getByRole('button',{name:'Policy'});opener.focus();fireEvent.click(opener);
    const dialog=screen.getByRole('dialog',{name:'LEGAL FRAMEWORK'});
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent(dialog,new Event('cancel',{bubbles:true,cancelable:true}));
    expect(screen.queryByRole('dialog',{name:'LEGAL FRAMEWORK'})).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
});
