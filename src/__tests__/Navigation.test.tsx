import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

afterEach(cleanup);

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
    for (const [name, href] of [['Directory', '/artists/'], ['Content Lab', '/blog/'], ['Dispatch', '/dispatch/'], ['Apply', '/submit/']]) {
        expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Search artists and stories' }));
    expect(open).toHaveBeenCalledOnce();
});
