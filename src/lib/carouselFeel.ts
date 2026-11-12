export type CarouselFeel = 'baseline' | 'direct' | 'weighted' | 'glide';
export const carouselFeels: Record<CarouselFeel, { label: string; settle: number; coast: number; maxThrow: number }> = {
    baseline: { label: 'Baseline', settle: 160, coast: 0, maxThrow: 0 },
    direct: { label: 'Direct', settle: 85, coast: 0, maxThrow: 0 },
    weighted: { label: 'Weighted', settle: 150, coast: 180, maxThrow: .85 },
    glide: { label: 'Free glide', settle: 280, coast: 420, maxThrow: 2.5 },
};
export function releasePosition(position: number, velocity: number, idleMs: number, feel: CarouselFeel, reduced: boolean) {
    const { coast, maxThrow } = carouselFeels[feel];
    const throwDistance = reduced || idleMs > 100 ? 0 : Math.max(-maxThrow, Math.min(maxThrow, velocity * coast));
    return Math.round(position + throwDistance);
}
export const dragDistance = (width: number) => Math.max(180, width * .42);
