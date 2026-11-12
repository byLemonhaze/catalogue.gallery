/** Mirror the image mesh's bottom edge in CSS pixels, leaving type as vector text. */
export function warpPoint(x: number, y: number, width: number, height: number, velocity: number, pointer: { x: number; y: number }, hover: number, time: number) {
    const speed = Math.max(-1, Math.min(1, velocity));
    const dx = x - pointer.x, dy = y - pointer.y;
    const pool = Math.exp(-(dx * dx + dy * dy) * 12) * hover;
    const ripple = pool * .085 * Math.sin(Math.hypot(dx, dy) * 14 - time * 2.4);
    return {
        x: (x + Math.sin(y * Math.PI) * speed * .17 + dx * ripple + (Math.max(0, Math.min(1, pointer.x)) - .5) * hover * .018) * width,
        y: (y + Math.sin(x * Math.PI) * speed * .095 + (y - .5) * Math.abs(speed) * .12 + dy * ripple + (Math.max(0, Math.min(1, pointer.y)) - .5) * hover * .018) * height,
    };
}
export function captionPoint(x: number, width: number, height: number, velocity: number, pointer: { x: number; y: number }, hover: number, time: number) {
    const point = warpPoint(x, 1, width, height, velocity, pointer, hover, time);
    return { x: point.x, y: point.y - height + 16 };
}
export function outlinePoints(width: number, height: number, velocity: number, pointer: { x: number; y: number }, hover: number, time: number) {
    return Array.from({length: 128}, (_, i) => {
        const t = (i % 32) / 32, side = Math.floor(i / 32);
        const [x, y] = side === 0 ? [t, 0] : side === 1 ? [1, t] : side === 2 ? [1-t, 1] : [0, 1-t];
        return warpPoint(x, y, width, height, velocity, pointer, hover, time);
    });
}
export function captionPath(width: number, height: number, velocity: number, pointer: { x: number; y: number }, hover: number, time: number) {
    return Array.from({ length: 33 }, (_, i) => {
        const point = captionPoint(i / 32, width, height, velocity, pointer, hover, time);
        return `${i ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }).join(' ');
}
