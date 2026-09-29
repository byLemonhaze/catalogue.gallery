import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ArtistCarousel } from '../components/ArtistCarousel';
const artists = ['One', 'Two', 'Three'].map((name, i) => ({ id: String(i), name, subtitle: '', thumbnail: null, websiteUrl: 'https://example.com' }));
class TestPointerEvent extends MouseEvent {
    pointerId: number; pointerType: string; isPrimary: boolean;
    constructor(type: string, init: PointerEventInit) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? 'touch'; this.isPrimary = init.isPrimary ?? true; }
}
function setup() {
    render(<MemoryRouter><Routes><Route path="/" element={<ArtistCarousel artists={artists} />} /><Route path="/artist/:id/" element={<p>Artist opened</p>} /></Routes></MemoryRouter>);
    return screen.getByRole('region', { name: 'Discover artists' });
}
beforeEach(() => {
    vi.stubGlobal('PointerEvent', TestPointerEvent);
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('carousel interactions', () => {
    it('allows a real tap and advances exactly once per arrow click', () => {
        setup(); fireEvent.click(screen.getByRole('button', { name: 'Next artist' }));
        expect(screen.getByRole('link', { name: 'Explore Two' })).toBeVisible();
        fireEvent.click(screen.getByRole('link', { name: 'Explore Two' }), { detail: 1 });
        expect(screen.getByText('Artist opened')).toBeVisible();
    });
    it('does not turn vertical scrolling into a slide change or artist visit', () => {
        setup(); const link = screen.getByRole('link', { name: 'Explore One' });
        fireEvent.pointerDown(link, { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(link, { clientX: 125, clientY: 220 });
        fireEvent.pointerUp(link, { clientX: 160, clientY: 300 });
        fireEvent.click(link, { detail: 1 });
        expect(screen.queryByText('Artist opened')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Explore One' })).toBeVisible();
    });
    it('advances on a horizontal swipe but suppresses its synthetic click', () => {
        setup(); const link = screen.getByRole('link', { name: 'Explore One' });
        fireEvent.pointerDown(link, { clientX: 250, clientY: 100 });
        fireEvent.pointerMove(link, { clientX: 150, clientY: 105 });
        fireEvent.pointerUp(link, { clientX: 100, clientY: 105 });
        const next = screen.getByRole('link', { name: 'Explore Two' });
        fireEvent.click(next, { detail: 1 }); expect(screen.queryByText('Artist opened')).not.toBeInTheDocument();
        fireEvent.pointerDown(next, { clientX: 180, clientY: 100 });
        fireEvent.pointerUp(next, { clientX: 180, clientY: 100 });
        fireEvent.click(next, { detail: 1 }); expect(screen.getByText('Artist opened')).toBeVisible();
    });
    it('cancels a drag without changing artists and scopes keyboard controls', () => {
        setup(); const link = screen.getByRole('link', { name: 'Explore One' });
        fireEvent.pointerDown(link, { clientX: 250, clientY: 100 });
        fireEvent.pointerMove(link, { clientX: 150, clientY: 105 }); fireEvent.pointerCancel(link);
        expect(screen.getByRole('link', { name: 'Explore One' })).toBeVisible();
        fireEvent.keyDown(window, { key: 'ArrowRight' }); expect(screen.getByRole('link', { name: 'Explore One' })).toBeVisible();
        fireEvent.keyDown(link, { key: 'ArrowRight' }); expect(screen.getByRole('link', { name: 'Explore Two' })).toBeVisible();
    });
});
