import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter, useLocation} from 'react-router-dom';
import {SiteLink} from '../components/SiteLink';
import {openingKind} from '../lib/pageOpening';
afterEach(cleanup);
function Position() { const {pathname, hash, state} = useLocation(); return <output data-testid="position">{pathname}{hash}|{JSON.stringify(state)}</output>; }
it('navigates normal links and keeps state plus caller callbacks', () => {
    const close = vi.fn();
    render(<MemoryRouter><SiteLink to="/stories/story/" state={{from:'search'}} onClick={close}>Story</SiteLink><Position/></MemoryRouter>);
    fireEvent.click(screen.getByRole('link'));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByTestId('position')).toHaveTextContent('/stories/story/|{"from":"search"}');
});
it('preserves cancellation, modifier clicks and new-tab URLs', () => {
    render(<MemoryRouter><SiteLink to="/stories/" onClick={event=>event.preventDefault()}>Cancelled</SiteLink><SiteLink to="/about/">About</SiteLink><SiteLink to="/dispatch/" target="_blank">New tab</SiteLink><Position/></MemoryRouter>);
    fireEvent.click(screen.getByText('Cancelled'));
    fireEvent.click(screen.getByText('About'), {ctrlKey:true});
    expect(screen.getByTestId('position')).toHaveTextContent('/|null');
    expect(screen.getByText('New tab')).toHaveAttribute('target','_blank');
    expect(screen.getByText('New tab')).toHaveAttribute('href','/dispatch/');
});
it('keeps profile background state and in-page anchors intact', () => {
    render(<MemoryRouter initialEntries={['/stories/story/']}><SiteLink to="/artist/person/" state={{backgroundLocation:{pathname:'/stories/story/'}}}>Artist</SiteLink><SiteLink to="#sources">Sources</SiteLink><Position/></MemoryRouter>);
    fireEvent.click(screen.getByText('Sources'));
    expect(screen.getByTestId('position')).toHaveTextContent('/stories/story/#sources');
    fireEvent.click(screen.getByText('Artist'));
    expect(screen.getByTestId('position')).toHaveTextContent('backgroundLocation');
});
it('chooses distinct article, edition and everyday page motion', () => {
    expect(openingKind('/stories/')).toBe('page');
    expect(openingKind('/stories/a-story/')).toBe('story');
    expect(openingKind('/dispatch/2026-11-11/')).toBe('dispatch');
    for(const path of ['/','/artists/','/about/','/submit/','/dispatch/']) expect(openingKind(path)).toBe('page');
});

it('normalizes legacy links from stored story content before navigation', () => {
    render(<MemoryRouter><SiteLink to="https://catalogue.gallery/blog/example/?ref=x#sources">Legacy story</SiteLink><SiteLink to="/info/">Legacy about</SiteLink><Position/></MemoryRouter>);
    expect(screen.getByText('Legacy story')).toHaveAttribute('href','/stories/example/?ref=x#sources');
    expect(screen.getByText('Legacy about')).toHaveAttribute('href','/about/');
    fireEvent.click(screen.getByText('Legacy story'));
    expect(screen.getByTestId('position')).toHaveTextContent('/stories/example/#sources');
});
