import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';

type Position = { x: number; y: number };
type Gesture = { id: number; x: number; y: number; left: number; top: number; width: number; height: number; moved: boolean };
const storageKey = 'catalogue-world-exit-position';
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function readPosition(): Position | null {
    try {
        const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
        return value && Number.isFinite(value.x) && Number.isFinite(value.y)
            ? { x: clamp(value.x), y: clamp(value.y) } : null;
    } catch { return null; }
}

export function WorldExitControl({ to, onExit }: { to: string; onExit: (event: MouseEvent<HTMLAnchorElement>) => void }) {
    const bounds = useRef<HTMLElement>(null);
    const link = useRef<HTMLAnchorElement>(null);
    const gesture = useRef<Gesture | null>(null);
    const suppressClick = useRef(false);
    const latestPosition = useRef<Position | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        // Keep SSR and the first hydration render identical.
        const frame = requestAnimationFrame(() => {
            const saved = readPosition();
            latestPosition.current = saved;
            setPosition(saved);
            link.current?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    function move(next: Position | null) {
        latestPosition.current = next;
        setPosition(next);
    }
    function save() {
        try { sessionStorage.setItem(storageKey, JSON.stringify(latestPosition.current)); } catch { /* Optional preference. */ }
    }
    function start(event: PointerEvent<HTMLAnchorElement>) {
        if (event.button !== 0 || event.isPrimary === false || !bounds.current) return;
        suppressClick.current = false;
        const box = bounds.current.getBoundingClientRect(), button = event.currentTarget.getBoundingClientRect();
        gesture.current = {
            id: event.pointerId, x: event.clientX, y: event.clientY,
            left: button.left - box.left, top: button.top - box.top,
            width: Math.max(1, box.width - button.width), height: Math.max(1, box.height - button.height), moved: false,
        };
        // Capture on the link so dragging remains reliable over a cross-origin iframe.
        event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    function drag(event: PointerEvent<HTMLAnchorElement>) {
        const current = gesture.current;
        if (!current || event.pointerId !== current.id) return;
        const dx = event.clientX - current.x, dy = event.clientY - current.y;
        if (!current.moved && Math.hypot(dx, dy) < 7) return;
        current.moved = true;
        suppressClick.current = true;
        setDragging(true);
        move({ x: clamp((current.left + dx) / current.width), y: clamp((current.top + dy) / current.height) });
    }
    function finish(event: PointerEvent<HTMLAnchorElement>) {
        const current = gesture.current;
        if (!current || event.pointerId !== current.id) return;
        if (current.moved) save();
        gesture.current = null;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
    function keyboard(event: KeyboardEvent<HTMLAnchorElement>) {
        if (event.key === 'Home') {
            event.preventDefault(); move(null);
            try { sessionStorage.removeItem(storageKey); } catch { /* Optional preference. */ }
            return;
        }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || !bounds.current) return;
        event.preventDefault();
        const box = bounds.current.getBoundingClientRect(), button = event.currentTarget.getBoundingClientRect();
        const width = Math.max(1, box.width - button.width), height = Math.max(1, box.height - button.height);
        const step = event.shiftKey ? 48 : 16;
        move({
            x: clamp((button.left - box.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0)) / width),
            y: clamp((button.top - box.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)) / height),
        });
        save();
    }
    const style = position ? { '--exit-x': `${position.x * 100}%`, '--exit-y': `${position.y * 100}%` } as CSSProperties : undefined;
    return <nav ref={bounds} className="world-controls" aria-label="Artist website controls" data-mobile-position="bottom-center">
        <Link ref={link} to={to} className="world-exit" style={style} data-dragging={dragging} draggable={false}
            aria-label="Exit Artist Universe" aria-describedby="world-exit-help"
            title="Exit world · Drag to move" onDragStart={event => event.preventDefault()}
            onPointerDown={start} onPointerMove={drag} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
            onKeyDown={keyboard} onClick={event => {
                if (suppressClick.current && event.detail !== 0) { event.preventDefault(); suppressClick.current = false; return; }
                onExit(event);
            }}>
            <svg className="world-exit-grip" width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
                {[2, 7, 12].flatMap(y => [2, 8].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" />))}
            </svg>
            <span>Exit world</span><span className="world-close-mark" aria-hidden="true" />
        </Link>
        <span id="world-exit-help" className="sr-only">Return to the artist profile. Drag to reposition, or use arrow keys when focused. Home resets the position.</span>
    </nav>;
}
