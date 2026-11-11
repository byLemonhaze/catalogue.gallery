import { expect, it } from 'vitest';
import { relativePosition, windowGeometry, wrap } from '../lib/windowsMotion';
it('grows the same preview toward the foreground and shrinks it away', () => {
    expect(windowGeometry(0).width).toBeGreaterThan(windowGeometry(-1).width);
    expect(windowGeometry(0).height).toBeGreaterThan(windowGeometry(1).height);
});
it('keeps position and dimensions continuous through every slot boundary', () => {
    for (const slot of [-2, -1, 0, 1, 2]) {
        const a = windowGeometry(slot - .00001), b = windowGeometry(slot + .00001);
        for (const key of ['left', 'top', 'width', 'height'] as const)
            expect(Math.abs(a[key] - b[key])).toBeLessThan(.01);
    }
});
it('wraps in both directions without jumping across the artist inventory', () => {
    expect(wrap(-1, 316)).toBe(315);
    expect(relativePosition(0, 315.8, 316)).toBeCloseTo(.2);
    expect(relativePosition(315, .2, 316)).toBeCloseTo(-1.2);
});
