import { WindowCaption } from './WindowCaption';
import { carouselFeels, dragDistance, releasePosition, type CarouselFeel } from '../lib/carouselFeel';
import { restoreDiscoveryPosition, type DiscoveryMemory } from '../lib/discoverySession';
import { useEffect, useRef, useState } from 'react';
import { SiteLink as Link } from './SiteLink';
import type { Artist } from '../hooks/useArtists';
import { captionCovered, relativePosition, naturalWindowGeometry, wrap } from '../lib/windowsMotion';
import { profileImage, profileAspect } from '../lib/profilePresentation';
import { ProfileLink } from './ProfileLink';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { createWindowWarp } from '../lib/windowWarp';

function updateFallbackCaptions(element: HTMLElement) {
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.world-window'));
    const surfaces = cards.map(card => ({ rect: (card.querySelector('img') || card).getBoundingClientRect(), depth: Number(card.style.zIndex) }));
    cards.forEach(card => {
        const caption = card.querySelector<HTMLElement>('.world-caption');
        if (caption && !card.dataset.warpReady) caption.dataset.covered = String(captionCovered(caption.getBoundingClientRect(), Number(card.style.zIndex), surfaces));
    });
}

function keyboardContextAvailable(element: HTMLElement, focused: Element | null) {
    if (document.querySelector('dialog[open]') || element.closest('[inert]')) return false;
    if (focused instanceof HTMLElement && (focused.isContentEditable || focused.matches('input:not([type="range"]),textarea,select,[role="textbox"]'))) return false;
    if (focused !== document.body && !element.closest('.windows-carousel')?.contains(focused)) return false;
    const rect = element.getBoundingClientRect();
    return !(rect.bottom < 80 || rect.top > innerHeight * .8);
}

export function WindowsCarousel({ artists, discoveryReady = true, memory, onRemember }: {
    artists: Artist[];
    discoveryReady?: boolean;
    memory?: DiscoveryMemory;
    onRemember?: (next: DiscoveryMemory) => void;
}) {
    const initialPosition = restoreDiscoveryPosition(artists, memory);
    const [position, setPosition] = useState(initialPosition);
    const [feel, setFeel] = useState<CarouselFeel>('weighted');
    const feelRef = useRef<CarouselFeel>('weighted');
    const [reduced, toggleReduced] = useMotionPreference();
    const stage = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({ width: 1000, height: 600 });
    const [loadedAspects, setLoadedAspects] = useState<Record<string, number>>({});
    useEffect(() => {
        const element = stage.current;
        if (!element || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setStageSize({ width: element.clientWidth, height: element.clientHeight }));
        observer.observe(element);
        return () => observer.disconnect();
    }, [artists.length]);
    const canvas = useRef<HTMLCanvasElement>(null);
    const warp = useRef({ velocity: 0, reduced: false });
    const [paused, setPaused] = useState(memory?.paused || false);
    const motionSettings = useRef({ reduced: false, paused: false });
    const idleUntil = useRef(0);
    const scrubHeld = useRef(false);
    const [scrubPosition, setScrubPosition] = useState<number | null>(null);
    const hold = () => { idleUntil.current = performance.now() + 6500; };
    useEffect(() => { motionSettings.current = { reduced, paused }; warp.current.reduced = reduced; }, [reduced, paused]);
    useEffect(() => {
        if (canvas.current && stage.current) return createWindowWarp(canvas.current, stage.current, warp.current) || undefined;
    }, [artists.length, reduced]);
    const target = useRef(initialPosition), current = useRef(initialPosition), frame = useRef(0), lastTime = useRef(0), snap = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const drag = useRef<{
        x: number;
        y: number;
        origin: number;
        horizontal: boolean;
        pointerId: number;
        lastX: number;
        lastTime: number;
        velocity: number;
    } | null>(null);
    const suppressClick = useRef(false);
    const count = artists.length;
    const active = count ? wrap(Math.round(position), count) : 0;
    const keyboardMove = useRef(false);
    useEffect(() => {
        if (keyboardMove.current) {
            stage.current?.querySelector<HTMLAnchorElement>('[tabindex="0"]')?.focus({ preventScroll: true });
            keyboardMove.current = false;
        }
    }, [active]);
    useEffect(() => {
        let onScreen = true;
        const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; }) : null;
        if (stage.current) observer?.observe(stage.current);
        const advanceRotation = (time: number, dt: number, available: boolean, focused: boolean | undefined) => {
            const settings = motionSettings.current;
            if (available && count > 1 && !settings.reduced && !settings.paused && !drag.current && !scrubHeld.current && !focused && time > idleUntil.current) target.current += dt / 8500;
        };
        const frameVelocity = (time: number, previous: number, dt: number) => {
            const gesture = drag.current;
            if (gesture?.horizontal && feelRef.current !== 'baseline') return time - gesture.lastTime < 80 ? gesture.velocity * 260 : 0;
            return (current.current - previous) / dt * 260;
        };
        const updatePosition = (available: boolean, dt: number) => {
            const settings = motionSettings.current;
            const direct = settings.reduced || (drag.current?.horizontal && feelRef.current !== 'baseline');
            const settle = scrubHeld.current ? 65 : carouselFeels[feelRef.current].settle;
            if (available) current.current = direct ? target.current : current.current + (target.current - current.current) * (1 - Math.exp(-dt / settle));
            if (available && onRemember && count) {
                const index = wrap(Math.round(current.current), count);
                onRemember({artistId: artists[index].id, offset: current.current - Math.round(current.current), paused: settings.paused});
            }
        };
        const tick = (time: number) => {
            const dt = lastTime.current ? Math.min(50, time - lastTime.current) : 16;
            lastTime.current = time;
            const element = stage.current;
            const available = discoveryReady && onScreen && !document.hidden && !element?.closest('[inert]');
            const focused = element?.closest('.windows-carousel')?.contains(document.activeElement) && document.activeElement?.matches(':focus-visible');
            if (available && element) updateFallbackCaptions(element);
            advanceRotation(time, dt, available, focused);
            const previous = current.current;
            updatePosition(available, dt);
            const velocity = frameVelocity(time, previous, dt);
            warp.current.velocity += (velocity - warp.current.velocity) * (1 - Math.exp(-dt / 90));
            if (!scrubHeld.current && Math.abs(current.current - target.current) < .001) setScrubPosition(null);
            if (Math.abs(current.current - previous) > .00001) setPosition(current.current);
            frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(frame.current); clearTimeout(snap.current); observer?.disconnect(); lastTime.current = 0; };
    }, [count, artists, onRemember, discoveryReady]);
    function remember(next: number, isPaused = paused) {
        if (count) onRemember?.({artistId: artists[wrap(Math.round(next), count)].id, offset: next - Math.round(next), paused: isPaused});
    }
    function move(next: number) { hold(); target.current = next; }
    function jump(next: number) {
        hold(); clearTimeout(snap.current); target.current = next; current.current = next; warp.current.velocity = 0; setScrubPosition(null); setPosition(next); remember(next);
    }
    function finishScrub() {
        if (!scrubHeld.current) return;
        scrubHeld.current = false;
        setScrubPosition(Math.round(target.current));
        move(Math.round(target.current));
    }
    const finishScrubRef = useRef(finishScrub);
    useEffect(() => { finishScrubRef.current = finishScrub; });
    const jumpRef = useRef(jump);
    useEffect(() => { jumpRef.current = jump; });
    const moveRef = useRef(move);
    useEffect(() => { moveRef.current = move; });
    useEffect(() => {
        const element = stage.current;
        if (!element)
            return;
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey || count < 2)
                return;
            event.preventDefault();
            moveRef.current(target.current + (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1) / Math.max(220, element.clientWidth * .42));
            clearTimeout(snap.current);
            snap.current = setTimeout(() => moveRef.current(Math.round(target.current)), 180);
        };
        element.addEventListener('wheel', wheel, { passive: false });
        return () => element.removeEventListener('wheel', wheel);
    }, [count]);
    useEffect(() => {
        const keys = (event: KeyboardEvent) => {
            const element = stage.current;
            if (!element || count < 2 || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
            const focused = document.activeElement;
            const range = focused?.matches('.window-scrubber input');
            if (!(range ? ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']).includes(event.key)) return;
            if (!keyboardContextAvailable(element, focused)) return;
            event.preventDefault();
            clearTimeout(snap.current);
            keyboardMove.current = !range && element.contains(focused);
            const next = Math.round(target.current) + (['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1);
            if (range) jumpRef.current(wrap(next, count)); else moveRef.current(next);
        };
        window.addEventListener('keydown', keys);
        return () => window.removeEventListener('keydown', keys);
    }, [count]);
    function release(cancelled = false) {
        const gesture = drag.current;
        drag.current = null;
        stage.current?.removeAttribute('data-dragging');
        hold();
        if (gesture?.horizontal) {
            move(releasePosition(target.current, gesture.velocity, performance.now()-gesture.lastTime, feelRef.current, reduced || cancelled));
            remember(target.current);
        }
    }
    const releaseRef = useRef(release);
    useEffect(() => { releaseRef.current = release; });
    useEffect(() => {
        const cancel = () => { finishScrubRef.current(); releaseRef.current(true); };
        window.addEventListener('blur', cancel);
        return () => window.removeEventListener('blur', cancel);
    }, []);
    if (!count) return null;
    // Only adjacent previews are mounted; the directory links every published profile.
    const visible = artists.map((artist, index) => ({ artist, index, d: relativePosition(index, position, count) })).filter(item => Math.abs(item.d) < 3.2);
    return <div className={`windows-carousel${reduced ? ' is-reduced' : ''}`} data-discovery-ready={discoveryReady} aria-busy={!discoveryReady} role="region" aria-roledescription="carousel" aria-label="Discover artist worlds">
    <div ref={stage} className="windows-stage" onPointerDown={event => {
        if (event.isPrimary === false) { release(true); return; }
        if (event.button !== 0 || count < 2) return;
        hold(); target.current = current.current; suppressClick.current = false; clearTimeout(snap.current);
        drag.current = { x: event.clientX, y: event.clientY, origin: current.current, horizontal: false, pointerId: event.pointerId, lastX: event.clientX, lastTime: performance.now(), velocity: 0 };
    }} onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        if (!gesture.horizontal && Math.hypot(dx, dy) > 8) {
            if (Math.abs(dy) >= Math.abs(dx)) { drag.current = null; return; }
            if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
            gesture.horizontal = true;
            suppressClick.current = true;
            event.currentTarget.dataset.dragging = 'true';
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (gesture.horizontal) {
            const time = performance.now(), distance = dragDistance(event.currentTarget.clientWidth);
            const instant = -(event.clientX - gesture.lastX) / distance / Math.max(8, time - gesture.lastTime);
            gesture.velocity = instant * .65 + gesture.velocity * .35;
            gesture.lastX = event.clientX; gesture.lastTime = time;
            const next = gesture.origin - dx / distance;
            move(next);
            if (feelRef.current !== 'baseline') { current.current = next; setPosition(next); }
            remember(next);
        }
    }} onPointerUp={() => release()} onPointerCancel={() => release(true)} onLostPointerCapture={() => { if (drag.current) release(true); }} onPointerLeave={() => { if (drag.current && !drag.current.horizontal) release(true); }} onDragStart={event => event.preventDefault()} onClickCapture={event => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    }}>
      <canvas ref={canvas} className="window-warp" aria-hidden="true"/>
      {visible.map(({ artist, index, d }) => {
            const geometry = naturalWindowGeometry(d, loadedAspects[artist.id] || profileAspect(artist), stageSize.width, stageSize.height);
            return <ProfileLink artist={artist} key={artist.id} className="world-window" data-framed={index % 4 === 1} aria-label={`View ${artist.name}`} tabIndex={index === active ? 0 : -1} style={{ left: `${geometry.left}%`, top: `${geometry.top}%`, width: `${geometry.width}%`, height: `${geometry.height}%`, opacity: geometry.opacity, zIndex: geometry.zIndex }}>
          {profileImage(artist) ? <img src={profileImage(artist)} alt="" onLoad={event => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) { const ratio = image.naturalWidth/image.naturalHeight; setLoadedAspects(previous => previous[artist.id] === ratio ? previous : {...previous, [artist.id]:ratio}); } }} draggable="false" decoding="async" loading={index === active ? 'eager' : 'lazy'} fetchPriority={index === active ? 'high' : 'auto'}/> : <span className="world-placeholder">{artist.name}</span>}
          <WindowCaption name={artist.name}/>
        </ProfileLink>;
        })}
    </div>
    <div className="windows-controls">
      <div><span className="eyebrow">Selected artist</span><ProfileLink artist={artists[active]} className="selected-artist">{artists[active].name}</ProfileLink></div>
      <div className="window-pagination"><span className="window-position" aria-label={`Artist ${active + 1} of ${count}`}>{String(active + 1).padStart(2, '0')} / {count}</span><button className="rotation-toggle" aria-pressed={paused || reduced} onClick={() => { setPaused(value => !value); remember(current.current, !paused); }} disabled={reduced}>{reduced ? 'Paused' : paused ? 'Resume' : 'Pause'}</button></div>
      <label className="window-scrubber"><span className="sr-only">Choose artist</span><input type="range" min="0" max={count - 1} step="0.001" disabled={count < 2} value={scrubPosition ?? Math.min(count - 1, wrap(position, count))} aria-valuetext={`${artists[active].name}, ${active + 1} of ${count}`}
        onPointerDown={event => {
            if (event.button !== 0 || count < 2) return;
            scrubHeld.current = true; hold(); clearTimeout(snap.current);
            // Rebase continuous rotations without changing the visible composition.
            current.current = wrap(current.current, count);
            target.current = current.current;
            setScrubPosition(Math.min(count - 1, current.current));
            event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={finishScrub} onPointerCancel={finishScrub} onLostPointerCapture={finishScrub} onBlur={finishScrub}
        onChange={event => {
            const next = Number(event.target.value);
            if (scrubHeld.current) { move(next); setScrubPosition(next); }
            else jump(Math.round(next));
        }}/></label>
    </div>
    <div className="window-bottom"><span><span className="gesture-pointer">Scroll, drag or use arrow keys.</span><span className="gesture-touch">Swipe sideways to explore. Scroll down for stories.</span></span><Link to="/artists/">View all artists</Link><button aria-pressed={reduced} onClick={toggleReduced}>Motion: {reduced ? 'reduced' : 'full'}</button></div>
    {import.meta.env.DEV && <fieldset className="carousel-feel-review"><legend>Local review · drag feel</legend>{(Object.keys(carouselFeels) as CarouselFeel[]).map(mode => <button key={mode} aria-pressed={feel === mode} onClick={() => { release(true); feelRef.current = mode; setFeel(mode); target.current = current.current; hold(); }}>{carouselFeels[mode].label}</button>)}</fieldset>}
  </div>;
}
