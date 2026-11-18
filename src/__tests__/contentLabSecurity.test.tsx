import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ContentLab } from '../pages/ContentLab';

afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });

it('removes an old saved API key and never persists a newly entered key', async () => {
    sessionStorage.setItem('content-lab:xai-api-key', 'old-test-key');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(Response.json({ result: [], drafts: [] }))));
    const view = render(<MemoryRouter><ContentLab /></MemoryRouter>);
    expect(sessionStorage.getItem('content-lab:xai-api-key')).toBeNull();
    fireEvent.change(screen.getByLabelText('Content Lab password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bring your own key' }));
    const input = screen.getByPlaceholderText('Paste xAI API key');
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: 'new-test-key' } });
    await waitFor(() => expect(input).toHaveValue('new-test-key'));
    expect(sessionStorage.getItem('content-lab:xai-api-key')).toBeNull();
    view.unmount();
    render(<MemoryRouter><ContentLab /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Content Lab password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bring your own key' }));
    expect(screen.getByPlaceholderText('Paste xAI API key')).toHaveValue('');
});
