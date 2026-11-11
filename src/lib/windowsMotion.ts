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
