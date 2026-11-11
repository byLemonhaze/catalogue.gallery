import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import { relativePosition, windowGeometry, wrap } from '../lib/windowsMotion';
import { profileImage } from '../lib/profilePresentation';
import { ProfileLink } from './ProfileLink';
export function WindowsCarousel({ artists }: {
    artists: Artist[];
}) {
    const [position, setPosition] = useState(0);
    const [reduced, setReduced] = useState(false);
    const stage = useRef<HTMLDivElement>(null);
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
        const preference = matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(preference.matches);
        update();
        preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);
    useEffect(() => () => { cancelAnimationFrame(frame.current); clearTimeout(snap.current); }, []);
    function move(next: number) {
        target.current = next;
        if (frame.current)
            return;
        const tick = (time: number) => {
            const dt = lastTime.current ? Math.min(50, time - lastTime.current) : 16;
            lastTime.current = time;
            current.current = reduced ? target.current : current.current + (target.current - current.current) * (1 - Math.exp(-dt / 115));
            setPosition(current.current);
            if (Math.abs(target.current - current.current) > .001)
                frame.current = requestAnimationFrame(tick);
            else {
                current.current = target.current;
                setPosition(target.current);
                frame.current = 0;
                lastTime.current = 0;
            }
        };
        frame.current = requestAnimationFrame(tick);
    }
    const moveRef = useRef(move);
    useEffect(() => { moveRef.current = move; });
    useEffect(() => {
        const element = stage.current;
        if (!element)
            return;
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey || Math.abs(event.deltaY) >= Math.abs(event.deltaX))
                return;
            event.preventDefault();
            moveRef.current(target.current + event.deltaX / Math.max(220, element.clientWidth * .42));
            clearTimeout(snap.current);
            snap.current = setTimeout(() => moveRef.current(Math.round(target.current)), 180);
        };
        element.addEventListener('wheel', wheel, { passive: false });
        return () => element.removeEventListener('wheel', wheel);
    }, []);
    if (!count)
        return null;
    // Only adjacent previews are mounted; the directory links every published profile.
    const visible = artists.map((artist, index) => ({ artist, index, d: relativePosition(index, position, count) })).filter(item => Math.abs(item.d) < 3.2);
    return <div className={`windows-carousel${reduced ? ' is-reduced' : ''}`} role="region" aria-roledescription="carousel" aria-label="Discover artist worlds">
    <div ref={stage} className="windows-stage" onKeyDown={event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                keyboardMove.current = true;
                move(Math.round(target.current) + (event.key === 'ArrowRight' ? 1 : -1));
            }
        }} onPointerDown={event => { if (event.button !== 0)
        return; suppressClick.current = false; clearTimeout(snap.current); drag.current = { x: event.clientX, y: event.clientY, origin: target.current, horizontal: false }; }} onPointerMove={event => {
            const gesture = drag.current;
            if (!gesture)
                return;
            const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
            if (!gesture.horizontal && Math.hypot(dx, dy) > 8) {
                if (Math.abs(dy) >= Math.abs(dx)) {
                    drag.current = null;
                    return;
                }
                gesture.horizontal = true;
                suppressClick.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
            }
            if (gesture.horizontal)
                move(gesture.origin - dx / Math.max(180, event.currentTarget.clientWidth * .42));
        }} onPointerUp={() => { if (drag.current?.horizontal)
        move(Math.round(target.current)); drag.current = null; }} onPointerCancel={() => { drag.current = null; move(Math.round(target.current)); }} onDragStart={event => event.preventDefault()} onClickCapture={event => { if (suppressClick.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
    } }}>
      <span className="windows-watermark" aria-hidden="true">CATALOGUE</span>
      {visible.map(({ artist, index, d }) => {
            const geometry = windowGeometry(d);
            return <ProfileLink artist={artist} key={artist.id} className="world-window" aria-label={`View ${artist.name}`} tabIndex={index === active ? 0 : -1} style={{ left: `${geometry.left}%`, top: `${geometry.top}%`, width: `${geometry.width}%`, height: `${geometry.height}%`, opacity: geometry.opacity, zIndex: geometry.zIndex }}>
          {profileImage(artist) ? <img src={profileImage(artist)} alt="" draggable="false" decoding="async" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'}/> : <span className="world-placeholder">{artist.name}</span>}
          <span className="world-caption">{artist.name}</span>
        </ProfileLink>;
        })}
    </div>
    <div className="windows-controls">
      <div><span className="eyebrow">Selected artist</span><ProfileLink artist={artists[active]} className="selected-artist">{artists[active].name}</ProfileLink></div>
      <div className="window-pagination"><button aria-label="Previous artist" onClick={() => move(Math.round(target.current) - 1)}>←</button><span aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, '0')} / {count}</span><button aria-label="Next artist" onClick={() => move(Math.round(target.current) + 1)}>→</button></div>
      <label className="window-scrubber"><span className="sr-only">Choose artist</span><input type="range" min="0" max={count - 1} step="1" value={active} aria-valuetext={artists[active].name} onChange={event => move(target.current + relativePosition(Number(event.target.value), target.current, count))}/></label>
    </div>
    <div className="window-bottom"><span>Swipe sideways to explore. Scroll down for stories.</span><Link to="/artists/">View all artists</Link><button aria-pressed={reduced} onClick={() => setReduced(value => !value)}>Motion: {reduced ? 'reduced' : 'full'}</button></div>
  </div>;
}
