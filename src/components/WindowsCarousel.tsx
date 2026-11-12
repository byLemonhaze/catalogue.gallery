import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import { captionCovered, relativePosition, naturalWindowGeometry, wrap } from '../lib/windowsMotion';
import { profileImage, profileAspect } from '../lib/profilePresentation';
import { ProfileLink } from './ProfileLink';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { createWindowWarp } from '../lib/windowWarp';
export function WindowsCarousel({ artists }: {
    artists: Artist[];
}) {
    const [position, setPosition] = useState(0);
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
    const [paused, setPaused] = useState(false);
    const motionSettings = useRef({ reduced: false, paused: false });
    const idleUntil = useRef(0);
    const scrubHeld = useRef(false);
    const hold = () => { idleUntil.current = performance.now() + 6500; };
    useEffect(() => { motionSettings.current = { reduced, paused }; warp.current.reduced = reduced; }, [reduced, paused]);
    useEffect(() => {
        if (canvas.current && stage.current) return createWindowWarp(canvas.current, stage.current, warp.current) || undefined;
    }, [artists.length, reduced]);
    const target = useRef(0), current = useRef(0), frame = useRef(0), lastTime = useRef(0), snap = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const drag = useRef<{
        x: number;
        y: number;
        origin: number;
        horizontal: boolean;
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
        const tick = (time: number) => {
            const dt = lastTime.current ? Math.min(50, time - lastTime.current) : 16;
            lastTime.current = time;
            const element = stage.current;
            const settings = motionSettings.current;
            const available = onScreen && !document.hidden && !element?.closest('[inert]');
            const focused = element?.closest('.windows-carousel')?.contains(document.activeElement) && document.activeElement?.matches(':focus-visible');
            if (available && element) {
                const cards = Array.from(element.querySelectorAll<HTMLElement>('.world-window'));
                const surfaces = cards.map(card => ({ rect: (card.querySelector('img') || card).getBoundingClientRect(), depth: Number(card.style.zIndex) }));
                cards.forEach(card => {
                    const caption = card.querySelector<HTMLElement>('.world-caption');
                    if (caption) caption.dataset.covered = String(captionCovered(caption.getBoundingClientRect(), Number(card.style.zIndex), surfaces));
                });
            }
            if (available && count > 1 && !settings.reduced && !settings.paused && !drag.current && !scrubHeld.current && !focused && time > idleUntil.current) target.current += dt / 8500;
            const previous = current.current;
            if (available) current.current = settings.reduced ? target.current : current.current + (target.current - current.current) * (1 - Math.exp(-dt / 160));
            const velocity = (current.current - previous) / dt * 260;
            warp.current.velocity += (velocity - warp.current.velocity) * (1 - Math.exp(-dt / 90));
            if (Math.abs(current.current - previous) > .00001) setPosition(current.current);
            frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(frame.current); clearTimeout(snap.current); observer?.disconnect(); lastTime.current = 0; };
    }, [count]);
    function move(next: number) { hold(); target.current = next; }
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
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            const focused = document.activeElement;
            const range = focused?.matches('.window-scrubber input');
            if (document.querySelector('dialog[open]') || element.closest('[inert]')) return;
            if (focused instanceof HTMLElement && (focused.isContentEditable || focused.matches('input:not([type="range"]),textarea,select,[role="textbox"]'))) return;
            if (focused !== document.body && !element.closest('.windows-carousel')?.contains(focused)) return;
            const rect = element.getBoundingClientRect();
            if (rect.bottom < 80 || rect.top > innerHeight * .8) return;
            event.preventDefault();
            clearTimeout(snap.current);
            keyboardMove.current = !range && element.contains(focused);
            moveRef.current(Math.round(target.current) + (event.key === 'ArrowRight' ? 1 : -1));
        };
        window.addEventListener('keydown', keys);
        return () => window.removeEventListener('keydown', keys);
    }, [count]);
    if (!count)
        return null;
    // Only adjacent previews are mounted; the directory links every published profile.
    const visible = artists.map((artist, index) => ({ artist, index, d: relativePosition(index, position, count) })).filter(item => Math.abs(item.d) < 3.2);
    return <div className={`windows-carousel${reduced ? ' is-reduced' : ''}`} role="region" aria-roledescription="carousel" aria-label="Discover artist worlds">
    <div ref={stage} className="windows-stage" onPointerDown={event => { if (event.button !== 0 || event.isPrimary === false)
        return; hold(); target.current = current.current; suppressClick.current = false; clearTimeout(snap.current); drag.current = { x: event.clientX, y: event.clientY, origin: target.current, horizontal: false }; }} onPointerMove={event => {
            const gesture = drag.current;
            if (!gesture)
                return;
            const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
            if (!gesture.horizontal && Math.hypot(dx, dy) > 8) {
                if (Math.abs(dy) >= Math.abs(dx)) {
                    drag.current = null;
                    return;
                }
                // Leave ambiguous diagonal movement to the page until intent is clear.
                if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
                gesture.horizontal = true;
                suppressClick.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
            }
            if (gesture.horizontal)
                move(gesture.origin - dx / Math.max(180, event.currentTarget.clientWidth * .42));
        }} onPointerUp={() => { hold(); if (drag.current?.horizontal)
        move(Math.round(target.current)); drag.current = null; }} onPointerCancel={() => { drag.current = null; move(Math.round(target.current)); }} onDragStart={event => event.preventDefault()} onClickCapture={event => { if (suppressClick.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
    } }}>
      <canvas ref={canvas} className="window-warp" aria-hidden="true"/>
      {visible.map(({ artist, index, d }) => {
            const geometry = naturalWindowGeometry(d, loadedAspects[artist.id] || profileAspect(artist), stageSize.width, stageSize.height);
            return <ProfileLink artist={artist} key={artist.id} className="world-window" data-framed={index % 4 === 1} aria-label={`View ${artist.name}`} tabIndex={index === active ? 0 : -1} style={{ left: `${geometry.left}%`, top: `${geometry.top}%`, width: `${geometry.width}%`, height: `${geometry.height}%`, opacity: geometry.opacity, zIndex: geometry.zIndex }}>
          {profileImage(artist) ? <img src={profileImage(artist)} alt="" onLoad={event => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) { const ratio = image.naturalWidth/image.naturalHeight; setLoadedAspects(previous => previous[artist.id] === ratio ? previous : {...previous, [artist.id]:ratio}); } }} draggable="false" decoding="async" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'}/> : <span className="world-placeholder">{artist.name}</span>}
          <span className="world-caption">{artist.name}</span>
        </ProfileLink>;
        })}
    </div>
    <div className="windows-controls">
      <div><span className="eyebrow">Selected artist</span><ProfileLink artist={artists[active]} className="selected-artist">{artists[active].name}</ProfileLink></div>
      <div className="window-pagination"><span className="window-position" aria-label={`Artist ${active + 1} of ${count}`}>{String(active + 1).padStart(2, '0')} / {count}</span><button className="rotation-toggle" aria-pressed={paused || reduced} onClick={() => setPaused(value => !value)} disabled={reduced}>{reduced ? 'Paused' : paused ? 'Resume' : 'Pause'}</button></div>
      <label className="window-scrubber"><span className="sr-only">Choose artist</span><input type="range" min="0" max={count - 1} step="0.01" value={wrap(position,count)} aria-valuetext={artists[active].name} onPointerDown={() => { scrubHeld.current = true; hold(); }} onPointerUp={() => { scrubHeld.current = false; hold(); }} onPointerCancel={() => { scrubHeld.current = false; hold(); }} onBlur={() => { scrubHeld.current = false; hold(); }} onChange={event => move(target.current + relativePosition(Number(event.target.value), target.current, count))}/></label>
    </div>
    <div className="window-bottom"><span><span className="gesture-pointer">Scroll, drag or use arrow keys.</span><span className="gesture-touch">Swipe sideways to explore. Scroll down for stories.</span></span><Link to="/artists/">View all artists</Link><button aria-pressed={reduced} onClick={toggleReduced}>Motion: {reduced ? 'reduced' : 'full'}</button></div>
  </div>;
}
