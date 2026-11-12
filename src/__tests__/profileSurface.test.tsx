import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {ProfileSurface} from '../components/ProfileSurface';
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
function setup(website='https://artist.example/'){render(<MemoryRouter><ProfileSurface src="/portrait.jpg" name="Test Artist" framed={false} to="/artist/test/world/" website={website}/></MemoryRouter>);return screen.getByRole('link');}
it('loads only after hover intent, reveals on load, reverses and releases the external frame',()=>{
    const link=setup();expect(document.querySelector('iframe')).toBeNull();
    fireEvent.pointerEnter(link);act(()=>vi.advanceTimersByTime(100));fireEvent.pointerLeave(link);
    act(()=>vi.advanceTimersByTime(200));expect(document.querySelector('iframe')).toBeNull();
    fireEvent.pointerEnter(link);act(()=>vi.advanceTimersByTime(160));
    const frame=screen.getByTitle('Test Artist website preview');
    expect(frame).toHaveAttribute('tabindex','-1');expect(frame).toHaveAttribute('sandbox','allow-scripts allow-same-origin');
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    fireEvent.load(frame);expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    expect(link).toHaveAttribute('href','/artist/test/world/');
    fireEvent.pointerLeave(link);expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    expect(frame).toBeInTheDocument();act(()=>vi.advanceTimersByTime(900));expect(document.querySelector('iframe')).toBeNull();
});
it('keeps the artwork when a preview fails or times out',()=>{
    const link=setup();fireEvent.pointerEnter(link);act(()=>vi.advanceTimersByTime(160));
    act(()=>vi.advanceTimersByTime(10000));
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    expect(screen.getByRole('img',{name:'Test Artist'})).toBeInTheDocument();
});
it('does not preview insecure URLs',()=>{
    const link=setup('http://artist.example/');fireEvent.pointerEnter(link);act(()=>vi.advanceTimersByTime(200));
    expect(document.querySelector('iframe')).toBeNull();
});
