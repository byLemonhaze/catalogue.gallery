import { describe, it, expect } from 'vitest';
import { moveGesture, gestureStep, type Gesture } from '../lib/carouselGesture';
const start = (): Gesture => ({ pointerId: 1, x: 0, y: 0, dx: 0, axis: 'pending', moved: false });
describe('carousel gesture intent', () => {
    it('keeps tap jitter still and treats zero as a valid start coordinate', () => {
        const result = moveGesture(start(), 4, 3);
        expect(result.axis).toBe('pending'); expect(result.moved).toBe(false); expect(gestureStep(result)).toBe(0);
    });
    it('yields a vertical scroll permanently even if it later moves sideways', () => {
        const result = moveGesture(moveGesture(start(), 8, 50), 150, 60);
        expect(result.axis).toBe('vertical'); expect(gestureStep(result)).toBe(0);
    });
    it('does not commit an ambiguous diagonal gesture', () => {
        expect(gestureStep(moveGesture(start(), 60, 50))).toBe(0);
    });
    it('changes exactly one slide for a committed horizontal gesture', () => {
        expect(gestureStep(moveGesture(start(), -200, 10))).toBe(1);
        expect(gestureStep(moveGesture(start(), 200, 10))).toBe(-1);
        expect(gestureStep(moveGesture(start(), 20, 2))).toBe(0);
    });
});
