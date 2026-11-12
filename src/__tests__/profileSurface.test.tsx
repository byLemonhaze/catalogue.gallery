import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {ProfileSurface} from '../components/ProfileSurface';
import {createProfileVortex} from '../lib/profileVortex';
vi.mock('../lib/profileVortex', () => ({createProfileVortex: vi.fn(() => null)}));
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();vi.mocked(createProfileVortex).mockReset();});
function setup(website: string | undefined='https://artist.example/') {
    return render(<MemoryRouter><ProfileSurface src="/portrait.jpg" name="Test Artist" framed={false} to="/artist/test/world/" website={website}/></MemoryRouter>);
}
const paint = async () => { await act(async () => { vi.advanceTimersToNextFrame(); }); };
async function loadCover(decode = () => Promise.resolve()) {
    const cover = document.querySelector<HTMLImageElement>('.portal-fallback')!;
    Object.defineProperty(cover, 'naturalWidth', {configurable: true, value: 900});
    cover.decode = decode;
    await act(async () => { fireEvent.load(cover); });
}
it('conceals a fast iframe until its artwork decodes and a cover frame is ready',async()=>{
    const view=setup();
    expect(document.querySelector('iframe')).toBeNull();
    await paint();
    const frame=screen.getByTitle('Test Artist website preview');
    expect(frame).toHaveAttribute('tabindex','-1');
    expect(frame).toHaveAttribute('sandbox','allow-scripts allow-same-origin');
    expect(frame).toHaveAttribute('allow',"autoplay 'none'; camera 'none'; microphone 'none'");
    fireEvent.load(frame);
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    let finish!: () => void;
    await loadCover(() => new Promise<void>(resolve => {finish = resolve;}));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    await act(async () => finish());
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    await paint();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    const link=screen.getByRole('link',{name:'Enter Test Artist’s world'});
    expect(link).toHaveAttribute('href','/artist/test/world/');
    fireEvent.pointerLeave(link);
    await act(async()=>vi.advanceTimersByTime(11000));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    view.unmount();expect(frame).not.toBeInTheDocument();
});
it('waits for the GPU first frame even when both the website and artwork are cached', async () => {
    vi.stubGlobal('WebGLRenderingContext', class {});
    let ready!: (state: 'ready' | 'fallback') => void;
    const renderer = {open:vi.fn(),destroy:vi.fn()};
    vi.mocked(createProfileVortex).mockImplementation((_canvas, _src, callback) => {ready=callback!;return renderer;});
    setup(); await paint(); await loadCover(); await paint();
    fireEvent.load(screen.getByTitle('Test Artist website preview'));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    expect(renderer.open).not.toHaveBeenCalledWith(true);
    act(()=>ready('ready'));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    expect(renderer.open).toHaveBeenLastCalledWith(true);
});
it('uses the decoded cover fade when a GPU texture times out', async () => {
    vi.stubGlobal('WebGLRenderingContext', class {});
    const renderer = {open:vi.fn(),destroy:vi.fn()};
    vi.mocked(createProfileVortex).mockReturnValue(renderer);
    setup(); await paint(); await loadCover(); await paint();
    fireEvent.load(screen.getByTitle('Test Artist website preview'));
    await act(async()=>vi.advanceTimersByTime(10000));
    expect(renderer.destroy).toHaveBeenCalledOnce();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-renderer','fallback');
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
});
it.each(['error','timeout'])('keeps the artwork when a preview encounters %s',async reason=>{
    setup();await paint(); await loadCover(); await paint();
    const frame=screen.getByTitle('Test Artist website preview');
    if(reason==='error')fireEvent.error(frame);else await act(async()=>vi.advanceTimersByTime(10000));
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    expect(screen.getByRole('img',{name:'Test Artist'})).toBeInTheDocument();
});
it('never reveals a website behind an undecodable image', async () => {
    setup(); await paint(); fireEvent.load(screen.getByTitle('Test Artist website preview'));
    await loadCover(() => Promise.reject(new Error('decode failed'))); await paint();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
});
it('does not preview insecure URLs',async()=>{
    setup('http://artist.example/');await paint();
    expect(document.querySelector('iframe')).toBeNull();
});
it('cancels preparation when the profile is immediately dismissed',async()=>{
    const view=setup();view.unmount();await paint();
    expect(document.querySelector('iframe')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
});
it('ignores late decoding after dismissal and starts a new cover for another artist', async () => {
    const view = setup(); await paint();
    fireEvent.load(screen.getByTitle('Test Artist website preview'));
    let finish!: () => void;
    await loadCover(() => new Promise<void>(resolve=>{finish=resolve;}));
    view.rerender(<MemoryRouter><ProfileSurface src="/other.jpg" name="Other Artist" framed={false} to="/artist/other/world/" website="https://other.example/"/></MemoryRouter>);
    await act(async()=>finish()); await paint();
    fireEvent.load(screen.getByTitle('Other Artist website preview'));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    await loadCover(); await paint();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
});
it('shows the ready preview without the vortex when reduced motion is requested',async()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    setup();await paint();
    fireEvent.load(screen.getByTitle('Test Artist website preview'));
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','false');
    await loadCover(); await paint();
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-open','true');
    expect(document.querySelector('.profile-portal')).toHaveAttribute('data-reduced','true');
    expect(document.querySelector('canvas')).toBeNull();
});
