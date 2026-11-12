import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {ProfileSurface} from '../components/ProfileSurface';
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
function setup(website: string | undefined='https://artist.example/') {
    return render(<MemoryRouter><ProfileSurface src="/portrait.jpg" name="Test Artist" framed={false} to="/artist/test/world/" website={website}/></MemoryRouter>);
}
it('prepares automatically after the card paints and reveals on load without hover',()=>{
    const view=setup();
    expect(document.querySelector('iframe')).toBeNull();
    act(()=>vi.advanceTimersToNextFrame());
    const frame=screen.getByTitle('Test Artist website preview');
    expect(frame).toHaveAttribute('tabindex','-1');
    expect(frame).toHaveAttribute('sandbox','allow-scripts allow-same-origin');
    expect(frame).toHaveAttribute('allow',"autoplay 'none'; camera 'none'; microphone 'none'");
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    fireEvent.load(frame);
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    const link=screen.getByRole('link',{name:'Enter Test Artist’s world'});
    expect(link).toHaveAttribute('href','/artist/test/world/');
    fireEvent.pointerLeave(link);
    act(()=>vi.advanceTimersByTime(11000));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    expect(frame).toBeInTheDocument();
    view.unmount();expect(frame).not.toBeInTheDocument();
});
it.each(['error','timeout'])('keeps the artwork when a preview encounters %s',reason=>{
    setup();act(()=>vi.advanceTimersToNextFrame());
    const frame=screen.getByTitle('Test Artist website preview');
    if(reason==='error')fireEvent.error(frame);else act(()=>vi.advanceTimersByTime(10000));
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    expect(screen.getByRole('img',{name:'Test Artist'})).toBeInTheDocument();
});
it('does not preview insecure URLs',()=>{
    setup('http://artist.example/');act(()=>vi.advanceTimersToNextFrame());
    expect(document.querySelector('iframe')).toBeNull();
});
it('cancels preparation when the profile is immediately dismissed',()=>{
    const view=setup();view.unmount();act(()=>vi.advanceTimersToNextFrame());
    expect(document.querySelector('iframe')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
});
it('shows the loaded preview without the vortex when reduced motion is requested',()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    setup();act(()=>vi.advanceTimersToNextFrame());
    fireEvent.load(screen.getByTitle('Test Artist website preview'));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-reduced','true');
    expect(document.querySelector('canvas')).toBeNull();
});
