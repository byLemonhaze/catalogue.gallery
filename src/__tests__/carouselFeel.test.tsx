import {useState} from 'react';
import {createDiscoverySession} from '../lib/discoverySession';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {WindowsCarousel} from '../components/WindowsCarousel';
import {releasePosition} from '../lib/carouselFeel';
import type {Artist} from '../hooks/useArtists';
import {createWindowWarp, type WarpMotion} from '../lib/windowWarp';
vi.mock('../lib/windowWarp',()=>({createWindowWarp:vi.fn(()=>null)}));
const artists: Artist[]=Array.from({length:20},(_,i)=>({id:String(i),name:`Artist ${i}`,subtitle:'',websiteUrl:'https://example.com',thumbnail:null}));
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('PointerEvent',MouseEvent);vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
const setup=(items=artists)=>render(<MemoryRouter><WindowsCarousel artists={items}/></MemoryRouter>);
it('keeps direct releases close and bounds weighted/glide momentum, including stale gestures',()=>{
    expect(releasePosition(3.2,.01,0,'direct',false)).toBe(3);
    expect(releasePosition(3.2,.01,0,'weighted',false)).toBe(4);
    expect(releasePosition(3.2,.01,0,'glide',false)).toBe(6);
    expect(releasePosition(3.2,100,0,'glide',false)).toBe(6);
    expect(releasePosition(3.2,.01,150,'glide',false)).toBe(3);
    expect(releasePosition(3.2,.01,0,'glide',true)).toBe(3);
});
it('keeps non-pointer selections precise across distant positions',()=>{
    setup();const slider=screen.getByRole('slider',{name:'Choose artist'});
    for (const index of [19,1,15,0]) {
        fireEvent.change(slider,{target:{value:String(index)}});
        expect(slider).toHaveValue(String(index));
        expect(document.querySelector('.selected-artist')).toHaveTextContent(`Artist ${index}`);
        act(()=>vi.advanceTimersByTime(50));
        expect(slider).toHaveValue(String(index));
    }
});
it('scrubs continuously with image bend, then settles without throwing past the chosen artist',()=>{
    const remember=vi.fn();
    render(<MemoryRouter><WindowsCarousel artists={artists} onRemember={remember}/></MemoryRouter>);
    const slider=screen.getByRole('slider');
    const motion=vi.mocked(createWindowWarp).mock.calls.at(-1)![2] as WarpMotion;
    fireEvent.pointerDown(slider,{button:0});
    fireEvent.change(slider,{target:{value:'3.65'}});
    expect(slider).toHaveValue('3.65');
    act(()=>vi.advanceTimersByTime(48));
    const moving=remember.mock.calls.at(-1)![0];
    const position=Number(moving.artistId)+moving.offset;
    expect(position).toBeGreaterThan(0);
    expect(position).toBeLessThan(3.65);
    expect(motion.velocity).toBeGreaterThan(0);
    act(()=>vi.advanceTimersByTime(1200));
    expect(slider).toHaveValue('3.65');
    expect(motion.velocity).toBeLessThan(.01);
    fireEvent.pointerUp(slider);
    expect(slider).toHaveValue('4');
    act(()=>vi.advanceTimersByTime(1800));
    expect(Number((slider as HTMLInputElement).value)).toBeCloseTo(4,2);
    expect(document.querySelector('.selected-artist')).toHaveTextContent('Artist 4');
    expect(remember.mock.calls.every(([value])=>Number(value.artistId)+value.offset<=4)).toBe(true);
});
it.each(['pointerCancel','lostPointerCapture','blur'] as const)('releases fractional scrubbing on %s and keeps both endpoints reachable',event=>{
    setup();const slider=screen.getByRole('slider');
    for (const value of [18.8,.2]) {
        fireEvent.pointerDown(slider,{button:0});
        fireEvent.change(slider,{target:{value:String(value)}});
        act(()=>vi.advanceTimersByTime(100));
        if(event==='blur') fireEvent.blur(window);
        else fireEvent[event](slider);
        act(()=>vi.advanceTimersByTime(2400));
        expect(Number((slider as HTMLInputElement).value)).toBeCloseTo(Math.round(value),2);
    }
    const stage=document.querySelector('.windows-stage') as HTMLElement;
    stage.getBoundingClientRect=()=>({top:100,bottom:600} as DOMRect);
    slider.focus();
    fireEvent.keyDown(window,{key:'ArrowUp'});
    expect(slider).toHaveValue('1');
    fireEvent.keyDown(window,{key:'ArrowDown'});
    expect(slider).toHaveValue('0');
});
it('tracks horizontal drag immediately, stops on blur and suppresses its click',()=>{
    setup();const stage=document.querySelector('.windows-stage') as HTMLElement;
    stage.setPointerCapture=vi.fn();
    fireEvent.pointerDown(stage,{button:0,pointerId:1,clientX:500,clientY:100});
    fireEvent.pointerMove(stage,{pointerId:1,clientX:140,clientY:105});
    expect(document.querySelector('.selected-artist')).toHaveTextContent('Artist 2');
    expect(stage).toHaveAttribute('data-dragging','true');
    fireEvent.blur(window);
    expect(stage).not.toHaveAttribute('data-dragging');
    const click=new MouseEvent('click',{bubbles:true,cancelable:true});
    fireEvent(screen.getByRole('link',{name:'View Artist 2'}),click);
    expect(click.defaultPrevented).toBe(true);
});
it('exposes local feel comparisons and disables the scrubber for one artist',()=>{
    setup(artists.slice(0,1));
    expect(screen.getByRole('slider')).toBeDisabled();
    for (const name of ['Baseline','Direct','Weighted','Free glide']) {
        fireEvent.click(screen.getByRole('button',{name}));
        expect(screen.getByRole('button',{name})).toHaveAttribute('aria-pressed','true');
    }
});

it('restores selection and pause when the homepage remounts within the same visit',()=>{
    function Visit() {
        const [session]=useState(()=>createDiscoverySession());
        const [home,setHome]=useState(true);
        return <MemoryRouter><button onClick={()=>setHome(value=>!value)}>Other page</button>{home && <WindowsCarousel artists={artists} memory={session.memory} onRemember={session.remember}/>}</MemoryRouter>;
    }
    render(<Visit/>);
    fireEvent.change(screen.getByRole('slider'),{target:{value:'17'}});
    fireEvent.click(screen.getByRole('button',{name:'Pause'}));
    fireEvent.click(screen.getByRole('button',{name:'Other page'}));
    fireEvent.click(screen.getByRole('button',{name:'Other page'}));
    expect(screen.getByRole('slider')).toHaveValue('17');
    expect(screen.getByRole('button',{name:'Resume'})).toHaveAttribute('aria-pressed','true');
});
