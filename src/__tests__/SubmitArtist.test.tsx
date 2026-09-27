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
    it('highlights every missing field together when Submit is clicked', async () => {
        expect(button()).toBeEnabled();
        expect(screen.queryByRole('button', { name: 'Test' })).not.toBeInTheDocument();
        fireEvent.click(button());
        for (const label of ['Thumbnail / Profile Image', 'Artist Name', 'Subtitle', 'Website URL', 'Contact Email']) {
            expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
        }
        expect(screen.getByText('Add a thumbnail or profile image.')).toBeInTheDocument();
        expect(screen.getByText('Add your website URL.')).toBeInTheDocument();
        expect(screen.getByText('Please complete the highlighted fields.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
        fill(); expect(button()).toBeDisabled(); await tick(); expect(button()).toBeEnabled();
        for (const label of ['Thumbnail / Profile Image', 'Artist Name', 'Subtitle', 'Website URL', 'Contact Email']) {
            expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'false');
        }
    });
    it('highlights only missing details and never sends an incomplete form', async () => {
        change('Artist Name', 'Artist'); change('Subtitle', 'Digital Artist'); change('Contact Email', 'artist@example.com');
        fireEvent.click(button());
        expect(screen.getByLabelText('Thumbnail / Profile Image')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Website URL')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Artist Name')).toHaveAttribute('aria-invalid', 'false');
        expect(fetch).not.toHaveBeenCalled();
    });
    it('rejects invalid image selections and email addresses', async () => {
        fill(); await tick();
        change('Contact Email', 'no-at-sign'); fireEvent.click(button());
        expect(screen.getByLabelText('Contact Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Enter a valid contact email.')).toBeInTheDocument();
        change('Contact Email', 'artist@example.com');
        fireEvent.change(screen.getByLabelText('Thumbnail / Profile Image'), { target: { files: [new File(['text'], 'file.txt', { type: 'text/plain' })] } });
        fireEvent.click(button());
        expect(screen.getByText('Choose a JPG, PNG, WebP or GIF image.')).toBeInTheDocument();
        expect(vi.mocked(fetch).mock.calls.every(([url]) => url !== '/api/submit')).toBe(true);
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
        expect(screen.getByLabelText('Artist Name')).toHaveValue('');
        expect(screen.getByLabelText('Thumbnail / Profile Image')).toHaveAttribute('aria-invalid', 'false');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    });
    it('guards direct form submission before the form is complete', async () => {
        await act(async () => fireEvent.submit(button().closest('form')!));
        expect(fetch).not.toHaveBeenCalled();
    });
});
