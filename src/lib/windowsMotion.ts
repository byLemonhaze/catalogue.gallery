export const wrap = (value: number, count: number) => ((value % count) + count) % count;
export const relativePosition = (index: number, position: number, count: number) => wrap(index - position + count / 2, count) - count / 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const slots = [[-.25, .38, .14, .24], [.075, .19, .22, .30], [.19, .68, .29, .44], [.60, .49, .57, .83], [.87, .18, .23, .32], [1.02, .74, .25, .35], [1.30, .43, .20, .27]];
function spline(a: number, b: number, c: number, d: number, t: number) {
    return .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
/** The approved Windows composition, interpolated continuously between artists. */
export function windowGeometry(distance: number) {
    const value = clamp(distance, -3, 3) + 3, index = Math.min(5, Math.floor(value)), t = value - index;
    const values = [0, 1, 2, 3].map(axis => spline(slots[Math.max(0, index - 1)][axis], slots[index][axis], slots[index + 1][axis], slots[Math.min(6, index + 2)][axis], t));
    return { left: (values[0] - values[2] / 2) * 100, top: (values[1] - values[3] / 2) * 100, width: values[2] * 100, height: values[3] * 100,
        opacity: clamp((3.2 - Math.abs(distance)) / .6, 0, 1), zIndex: Math.round(100 - Math.abs(distance) * 10) };
}

export type SurfaceRect = { left: number; top: number; right: number; bottom: number };
/** Hide a background label as a unit when a nearer artwork covers it. */
export function captionCovered(caption: SurfaceRect, depth: number, surfaces: { rect: SurfaceRect; depth: number }[]) {
    return surfaces.some(surface => surface.depth > depth && caption.left < surface.rect.right && caption.right > surface.rect.left && caption.top < surface.rect.bottom && caption.bottom > surface.rect.top);
}

/** Fit the original image inside the moving slot without cropping or stretching. */
export function naturalWindowGeometry(distance: number, aspect: number | undefined, stageWidth: number, stageHeight: number) {
    const box = windowGeometry(distance);
    if (!aspect || !Number.isFinite(aspect) || aspect <= 0 || stageWidth <= 0 || stageHeight <= 0) return box;
    const maxWidth = box.width * stageWidth / 100;
    const maxHeight = Math.max(1, box.height * stageHeight / 100 - 29);
    const imageHeight = Math.min(maxHeight, maxWidth / aspect);
    const width = imageHeight * aspect / stageWidth * 100;
    const height = (imageHeight + 29) / stageHeight * 100;
    return { ...box, left: box.left + (box.width-width)/2, top: box.top + (box.height-height)/2, width, height };
}
