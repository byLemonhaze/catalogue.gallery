export type Gesture = { pointerId: number; x: number; y: number; dx: number; axis: 'pending' | 'horizontal' | 'vertical'; moved: boolean };
export function moveGesture(start: Gesture, x: number, y: number): Gesture {
    const dx = x - start.x;
    const dy = y - start.y;
    let axis = start.axis;
    if (axis === 'pending' && Math.max(Math.abs(dx), Math.abs(dy)) >= 10) {
        if (Math.abs(dx) > Math.abs(dy) * 1.5) axis = 'horizontal';
        else if (Math.abs(dy) >= Math.abs(dx)) axis = 'vertical';
    }
    return { ...start, dx, axis, moved: start.moved || Math.hypot(dx, dy) >= 10 };
}
export function gestureStep(gesture: Gesture): -1 | 0 | 1 {
    if (gesture.axis !== 'horizontal' || Math.abs(gesture.dx) < 50) return 0;
    return gesture.dx < 0 ? 1 : -1;
}
