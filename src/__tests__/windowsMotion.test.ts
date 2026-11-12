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

import { captionCovered } from '../lib/windowsMotion';
it('hides a background label behind a nearer artwork but leaves foreground and clear labels visible', () => {
    const caption = { left: 600, right: 800, top: 300, bottom: 329 };
    const front = { rect: { left: 400, right: 700, top: 100, bottom: 500 }, depth: 100 };
    expect(captionCovered(caption, 90, [front])).toBe(true);
    expect(captionCovered(caption, 110, [front])).toBe(false);
    expect(captionCovered({ ...caption, left: 710 }, 90, [front])).toBe(false);
});

import {naturalWindowGeometry} from '../lib/windowsMotion';
it('preserves portrait, square and panoramic proportions throughout movement',()=>{
    for(const aspect of [.3,1,3]) for(const distance of [-2,-.6,0,.8,2]){
        const box=naturalWindowGeometry(distance,aspect,1200,600);
        expect((box.width*12)/(box.height*6-29)).toBeCloseTo(aspect,5);
        expect(box.width).toBeLessThanOrEqual(windowGeometry(distance).width+.00001);
        expect(box.height).toBeLessThanOrEqual(windowGeometry(distance).height+.00001);
    }
});
