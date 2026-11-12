import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { WorldExitControl } from '../components/WorldExitControl';

const storageKey = 'catalogue-world-exit-position';
function Probe() { return <output data-testid="route">{useLocation().pathname}</output>; }
beforeEach(() => {
    sessionStorage.clear();
    class TestPointerEvent extends MouseEvent {
        pointerId: number;
        isPrimary: boolean;
        constructor(type: string, props: PointerEventInit) { super(type, props); this.pointerId = props.pointerId || 1; this.isPrimary = props.isPrimary ?? true; }
    }
    vi.stubGlobal('PointerEvent', TestPointerEvent);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });

async function setup() {
    const onExit = vi.fn();
    const view = render(<MemoryRouter><WorldExitControl to="/artist/example/" onExit={onExit}/><Probe/></MemoryRouter>);
    const exit = screen.getByRole('link', { name: 'Exit Artist Universe' });
    const bounds = screen.getByRole('navigation', { name: 'Artist website controls' });
    bounds.getBoundingClientRect = () => new DOMRect(12, 12, 376, 776);
    exit.getBoundingClientRect = () => new DOMRect(
        12 + 236 * (exit.style.getPropertyValue('--exit-x') ? parseFloat(exit.style.getPropertyValue('--exit-x')) / 100 : .5),
        12 + 728 * (exit.style.getPropertyValue('--exit-y') ? parseFloat(exit.style.getPropertyValue('--exit-y')) / 100 : 1), 140, 48);
    exit.setPointerCapture = vi.fn(); exit.hasPointerCapture = () => true; exit.releasePointerCapture = vi.fn();
    await waitFor(() => expect(exit).toHaveFocus());
    return { ...view, exit, onExit };
}

it('has one exit action; a small touch movement still acts as a tap', async () => {
    const { exit, onExit } = await setup();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(exit).toHaveTextContent('Exit world');
    expect(exit).not.toHaveTextContent('CATALOGUE');
    fireEvent.pointerDown(exit, { button: 0, clientX: 150, clientY: 760, pointerId: 1 });
    fireEvent.pointerMove(exit, { clientX: 153, clientY: 762, pointerId: 1 });
    fireEvent.pointerUp(exit, { pointerId: 1 });
    fireEvent.click(exit, { detail: 1 });
    expect(onExit).toHaveBeenCalledOnce();
    expect(screen.getByTestId('route')).toHaveTextContent('/artist/example/');
});

it('captures a drag across an iframe, clamps to the safe bounds and suppresses the release click', async () => {
    const { exit, onExit } = await setup();
    fireEvent.pointerDown(exit, { button: 0, clientX: 150, clientY: 760, pointerId: 1 });
    expect(exit.setPointerCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(exit, { clientX: -999, clientY: -999, pointerId: 1 });
    expect(exit.style.getPropertyValue('--exit-x')).toBe('0%');
    expect(exit.style.getPropertyValue('--exit-y')).toBe('0%');
    fireEvent.pointerMove(exit, { clientX: 9999, clientY: 9999, pointerId: 1 });
    expect(exit.style.getPropertyValue('--exit-x')).toBe('100%');
    expect(exit.style.getPropertyValue('--exit-y')).toBe('100%');
    fireEvent.pointerUp(exit, { pointerId: 1 });
    fireEvent.click(exit, { detail: 1 });
    expect(onExit).not.toHaveBeenCalled();
    expect(screen.getByTestId('route')).toHaveTextContent(/^\/$/);
    expect(exit).toHaveAttribute('data-dragging', 'false');
    expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toEqual({ x: 1, y: 1 });
    // The next deliberate tap must still exit.
    fireEvent.pointerDown(exit, { button: 0, clientX: 260, clientY: 760, pointerId: 2 });
    fireEvent.pointerUp(exit, { pointerId: 2 });
    fireEvent.click(exit, { detail: 1 });
    expect(onExit).toHaveBeenCalledOnce();
});

it('remembers a relative position between worlds and supports keyboard movement and reset', async () => {
    sessionStorage.setItem(storageKey, JSON.stringify({ x: .25, y: .75 }));
    const { exit } = await setup();
    expect(exit.style.getPropertyValue('--exit-x')).toBe('25%');
    fireEvent.keyDown(exit, { key: 'ArrowLeft' });
    expect(parseFloat(exit.style.getPropertyValue('--exit-x'))).toBeLessThan(25);
    fireEvent.keyDown(exit, { key: 'ArrowUp', shiftKey: true });
    expect(parseFloat(exit.style.getPropertyValue('--exit-y'))).toBeLessThan(75);
    const saved = sessionStorage.getItem(storageKey);
    cleanup();
    const next = await setup();
    expect(parseFloat(next.exit.style.getPropertyValue('--exit-y')) / 100).toBeCloseTo(JSON.parse(saved!).y);
    fireEvent.keyDown(next.exit, { key: 'Home' });
    expect(next.exit.style.getPropertyValue('--exit-x')).toBe('');
    expect(sessionStorage.getItem(storageKey)).toBeNull();
});

it('ignores malformed preferences and ends a cancelled drag without trapping the link', async () => {
    sessionStorage.setItem(storageKey, '{invalid');
    const { exit, onExit } = await setup();
    expect(exit.style.getPropertyValue('--exit-x')).toBe('');
    fireEvent.pointerDown(exit, { button: 0, clientX: 150, clientY: 760, pointerId: 1 });
    fireEvent.pointerMove(exit, { clientX: 240, clientY: 500, pointerId: 1 });
    fireEvent.pointerCancel(exit, { pointerId: 1 });
    expect(exit).toHaveAttribute('data-dragging', 'false');
    fireEvent.click(exit, { detail: 0 }); // Keyboard activation is never swallowed.
    expect(onExit).toHaveBeenCalledOnce();
});
