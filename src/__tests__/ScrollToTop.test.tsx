import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ScrollToTop } from '../components/ScrollToTop';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('preserves scroll on explicit modal dismissal but resets a subsequent ordinary page visit', () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const backgroundLocation = { pathname: '/stories/', search: '?view=list', hash: '#recent', state: null, key: 'stories' };
    function Controls() {
        const navigate = useNavigate();
        return <><button onClick={() => navigate(backgroundLocation, { replace: true })}>Close profile</button><button onClick={() => navigate('/about/')}>About</button></>;
    }
    render(<MemoryRouter initialEntries={[{ pathname: '/artist/test/', state: { backgroundLocation } }]}><ScrollToTop /><Controls /></MemoryRouter>);
    fireEvent.click(screen.getByText('Close profile'));
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('About'));
    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll).toHaveBeenCalledWith(0, 0);
});
