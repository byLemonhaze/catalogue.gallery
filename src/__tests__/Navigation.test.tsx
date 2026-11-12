import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

afterEach(cleanup);

it.each([300, 0])('handles an image completed before hydration (naturalWidth=%s)', async (naturalWidth) => {
    const view = <MemoryRouter><Navigation /></MemoryRouter>;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view);
    document.body.append(container);
    const image = container.querySelector('img')!;
    Object.defineProperties(image, {
        complete: { value: true },
        naturalWidth: { value: naturalWidth },
    });
    expect(container.querySelector('.catalogue-signature')).toHaveAttribute('data-loaded', 'false');
    const root = await act(async () => hydrateRoot(container, view));
    try {
        // No load event is dispatched: it already happened before React started.
        expect(container.querySelector('.catalogue-signature')).toHaveAttribute('data-loaded', String(naturalWidth > 0));
        expect(screen.getByRole('link', { name: 'CATALOGUE.gallery' })).toHaveAttribute('href', '/');
    } finally {
        await act(async () => root.unmount());
        container.remove();
    }
});

it('keeps the home link named and usable before, after and without the signature asset', () => {
    render(<MemoryRouter><Navigation /></MemoryRouter>);
    const home = screen.getByRole('link', { name: 'CATALOGUE.gallery' });
    const image = home.querySelector('img')!;
    expect(home).toHaveAttribute('href', '/');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    fireEvent.load(image);
    expect(home).toHaveAccessibleName('CATALOGUE.gallery');
    fireEvent.error(image);
    expect(home).toHaveAccessibleName('CATALOGUE.gallery');
    expect(home.querySelector('.catalogue-signature')).toHaveAttribute('data-loaded', 'false');
});

it('keeps all five navigation actions and search available with the signature', () => {
    const open = vi.fn();
    render(<MemoryRouter><Navigation onSearchOpen={open} /></MemoryRouter>);
    for (const [name, href] of [['Directory', '/artists/'], ['Stories', '/stories/'], ['Dispatch', '/dispatch/'], ['Apply', '/submit/']]) {
        expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Search artists and stories' }));
    expect(open).toHaveBeenCalledOnce();
});
