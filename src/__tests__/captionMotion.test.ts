import {expect,it} from 'vitest';
import {captionPoint,outlinePoints,warpPoint} from '../lib/captionMotion';
const pointer={x:.5,y:.5};
it('rests on a straight readable baseline and deforms with the artwork edge',()=>{
    for (const x of [0,.25,.5,.75,1]) {
        expect(captionPoint(x,400,300,0,pointer,0,0)).toEqual({x:x*400,y:16});
        const image=warpPoint(x,1,400,300,.7,pointer,.4,5);
        const caption=captionPoint(x,400,300,.7,pointer,.4,5);
        expect(caption.x).toBe(image.x);
        expect(caption.y+300-16).toBeCloseTo(image.y);
    }
    expect(captionPoint(.5,400,300,1,pointer,0,0).y).toBeGreaterThan(captionPoint(0,400,300,1,pointer,0,0).y);
});
it('keeps click outlines finite at extreme speed and off-image pointers',()=>{
    const points=outlinePoints(400,300,1e5,{x:-10,y:20},1,100);
    expect(points).toHaveLength(128);
    expect(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);
    const rest=outlinePoints(400,300,0,pointer,0,0);
    expect(Math.min(...rest.map(p=>p.x))).toBe(0);
    expect(Math.max(...rest.map(p=>p.y))).toBe(300);
});
