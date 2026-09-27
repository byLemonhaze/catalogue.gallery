import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { SubmitArtist } from '../pages/SubmitArtist';

const result = (status = 'compatible') => ({ ok: true, json: async () => ({ status, message: `Website ${status}` }) });
const tick = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(650); }); };
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const button = () => screen.getByRole('button', { name: 'Submit Application' });
function fill() {
    change('Artist Name', 'Artist'); change('Subtitle', 'Digital Artist'); change('Contact Email', 'artist@example.com');
    change('Website URL', 'https://artist.com');
    fireEvent.change(screen.getByLabelText('Thumbnail / Profile Image'), { target: { files: [new File(['image'], 'portrait.png', { type: 'image/png' })] } });
}
beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(result()));
    URL.createObjectURL = vi.fn().mockReturnValue('blob:preview');
    URL.revokeObjectURL = vi.fn();
    render(<HelmetProvider><SubmitArtist /></HelmetProvider>);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('application form', () => {
    it('requires every field and a completed check, with no Test button', async () => {
        expect(button()).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Test' })).not.toBeInTheDocument();
        fill(); expect(button()).toBeDisabled(); await tick(); expect(button()).toBeEnabled();
        for (const [label, value] of [['Artist Name', 'Artist'], ['Subtitle', 'Digital Artist'], ['Contact Email', 'artist@example.com']]) {
            change(label, '  '); expect(button()).toBeDisabled(); change(label, value); expect(button()).toBeEnabled();
        }
        fireEvent.change(screen.getByLabelText('Thumbnail / Profile Image'), { target: { files: [] } });
        expect(button()).toBeDisabled();
    });
    it('rejects invalid image selections and email addresses', async () => {
        fill(); await tick();
        change('Contact Email', 'no-at-sign'); expect(button()).toBeDisabled();
        change('Contact Email', 'artist@example.com');
        fireEvent.change(screen.getByLabelText('Thumbnail / Profile Image'), { target: { files: [new File(['text'], 'file.txt', { type: 'text/plain' })] } });
        expect(button()).toBeDisabled();
        expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG');
    });
    it.each(['blocked', 'unknown'])('disables submit when the scan is %s and rechecks on focus', async status => {
        vi.mocked(fetch).mockResolvedValueOnce(result(status) as Response);
        fill(); await tick(); expect(button()).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent(`Website ${status}`);
        fireEvent(window, new Event('focus')); await tick(); expect(button()).toBeEnabled();
    });
    it('ignores stale responses and invalidates a pass immediately when the URL changes', async () => {
        let resolveOld!: (response: Response) => void;
        vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
        fill(); await tick();
        change('Website URL', 'https://another-artist.com'); expect(button()).toBeDisabled();
        vi.mocked(fetch).mockResolvedValueOnce(result('blocked') as Response);
        await tick();
        await act(async () => resolveOld(result() as Response));
        expect(screen.getByRole('status')).toHaveTextContent('Website blocked');
        expect(button()).toBeDisabled();
    });
    it('debounces typing and handles a failed check without enabling submit', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
        fill(); change('Website URL', 'https://next-artist.com');
        expect(fetch).not.toHaveBeenCalled(); await tick();
        expect(fetch).toHaveBeenCalledTimes(1); expect(button()).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('couldn’t check');
    });
    it('submits a complete form and resets its image and fields', async () => {
        fill(); await tick();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);
        await act(async () => fireEvent.submit(button().closest('form')!));
        expect(fetch).toHaveBeenLastCalledWith('/api/submit', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
        expect(screen.getByText('Application received. We will be in touch shortly.')).toBeInTheDocument();
        expect(button()).toBeDisabled(); expect(screen.getByLabelText('Artist Name')).toHaveValue('');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    });
    it('guards direct form submission before the form is complete', async () => {
        await act(async () => fireEvent.submit(button().closest('form')!));
        expect(fetch).not.toHaveBeenCalled();
    });
});
