import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArtistCard } from './ArtistCard';
import { Link } from 'react-router-dom';
import { moveGesture, gestureStep, type Gesture } from '../lib/carouselGesture';
import { urlFor } from '../sanity/image';
import type { Artist } from '../hooks/useArtists';

interface ArtistCarouselProps {
    artists: Artist[];
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    onGlowColor?: (rgb: string) => void;
}

function CarouselArrow({
    direction,
    onClick,
    className,
}: {
    direction: 'prev' | 'next';
    onClick: () => void;
    className: string;
}) {
    const isPrev = direction === 'prev';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={isPrev ? 'Previous artist' : 'Next artist'}
            className={`group absolute top-1/2 z-30 -translate-y-1/2 cursor-pointer appearance-none rounded-none border-0 bg-transparent p-0 text-white/60 carousel-arrow transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:text-white ${className}`}
        >
            <span className={`flex items-center ${isPrev ? '' : 'justify-end'}`}>
                {isPrev && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                )}
                {!isPrev && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                )}
            </span>
        </button>
    );
}

export const ArtistCarousel: React.FC<ArtistCarouselProps> = ({ artists, initialIndex = 0, onIndexChange, onGlowColor }) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const gesture = useRef<Gesture | null>(null);
    const suppressClick = useRef(false);
    const motionFrame = useRef(0);
    useEffect(() => () => cancelAnimationFrame(motionFrame.current), []);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const totalItems = artists.length;
    const currentIndex = totalItems > 0 ? Math.min(activeIndex, totalItems - 1) : 0;

    const next = useCallback(() => {
        if (totalItems < 2) return;
        setActiveIndex((current: number) => (current + 1) % totalItems);
    }, [totalItems]);

    const prev = useCallback(() => {
        if (totalItems < 2) return;
        setActiveIndex((current: number) => (current - 1 + totalItems) % totalItems);
    }, [totalItems]);

    // Notify parent when index changes — kept out of the state updater
    useEffect(() => {
        onIndexChange?.(currentIndex);
    }, [currentIndex, onIndexChange]);

    // Sample dominant color from active artist thumbnail
    useEffect(() => {
        if (!onGlowColor) return;
        const artist = artists[currentIndex];
        if (!artist?.thumbnail) { onGlowColor('20, 20, 20'); return; }

        const imageUrl = artist.isSanity
            ? urlFor(artist.thumbnail).width(80).height(80).url()
            : typeof artist.thumbnail === 'string' ? artist.thumbnail : null;

        if (!imageUrl) { onGlowColor('20, 20, 20'); return; }

        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (cancelled) return;
            const canvas = document.createElement('canvas');
            canvas.width = 40; canvas.height = 40;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, 40, 40);
            const data = ctx.getImageData(0, 0, 40, 40).data;
            let r = 0, g = 0, b = 0;
            const n = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i]; g += data[i + 1]; b += data[i + 2];
            }
            onGlowColor(`${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)}`);
        };
        img.onerror = () => { if (!cancelled) onGlowColor('20, 20, 20'); };
        img.src = imageUrl;
        return () => { cancelled = true; };
    }, [currentIndex, artists, onGlowColor]);

    const resetGesture = () => {
        cancelAnimationFrame(motionFrame.current);
        gesture.current = null;
        setIsDragging(false);
        setDragOffset(0);
    };
    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary) { suppressClick.current = true; resetGesture(); return; }
        if (event.pointerType === 'mouse' || (event.target as Element).closest('button')) return;
        suppressClick.current = false;
        gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, axis: 'pending', moved: false };
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const nextGesture = moveGesture(current, event.clientX, event.clientY);
        gesture.current = nextGesture;
        if (nextGesture.moved) suppressClick.current = true;
        if (nextGesture.axis !== 'horizontal') return;
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
        cancelAnimationFrame(motionFrame.current);
        motionFrame.current = requestAnimationFrame(() => setDragOffset(Math.max(-100, Math.min(100, nextGesture.dx * 0.65))));
    };
    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!gesture.current || gesture.current.pointerId !== event.pointerId) return;
        const completed = moveGesture(gesture.current, event.clientX, event.clientY);
        suppressClick.current = completed.moved;
        const step = gestureStep(completed);
        if (step === 1) next();
        if (step === -1) prev();
        resetGesture();
    };
    const cancelGesture = () => {
        if (gesture.current) suppressClick.current = true;
        resetGesture();
    };

    const getRelativeDiff = (index: number) => {
        let diff = index - currentIndex;
        if (diff > totalItems / 2) diff -= totalItems;
        if (diff < -totalItems / 2) diff += totalItems;
        return diff;
    };

    const visibleIndices = artists
        .map((_, index) => index)
        .filter((index) => Math.abs(getRelativeDiff(index)) <= 1);

    // Calculate position for each item relative to active index
    const getStyles = (index: number) => {
        const diff = getRelativeDiff(index);
        const isActive = diff === 0;
        const isPrev = diff === -1;
        const isNext = diff === 1;
        const transition = isDragging
            ? 'none'
            : 'transform 240ms ease-out, opacity 180ms ease';

        const base: React.CSSProperties = {
            transition,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%) scale(0.75)',
            opacity: 0,
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'blur(2px) grayscale(92%)',
            willChange: 'transform, opacity, filter',
            backfaceVisibility: 'hidden',
        };

        let style: React.CSSProperties = base;

        if (isActive) {
            style = {
                ...base,
                opacity: 1,
                zIndex: 20,
                pointerEvents: 'auto',
                filter: 'none',
                transform: `translateX(calc(-50% + ${dragOffset}px)) scale(1)`,
            };
        } else if (isPrev) {
            style = {
                ...base,
                opacity: 0.18,
                zIndex: 10,
                transform: `translateX(calc(-98% + ${dragOffset}px)) scale(0.78)`,
            };
        } else if (isNext) {
            style = {
                ...base,
                opacity: 0.18,
                zIndex: 10,
                transform: `translateX(calc(-2% + ${dragOffset}px)) scale(0.78)`,
            };
        }

        return { style, diff };
    };

    return (
        <div className="w-full flex flex-col items-center" role="region" aria-roledescription="carousel" aria-label="Discover artists"
            onKeyDown={(event) => {
                if ((event.target as Element).closest('input, textarea, select')) return;
                if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
                if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
            }}>
            <span className="sr-only" aria-live="polite" aria-atomic="true">{artists[currentIndex]?.name}, {currentIndex + 1} of {totalItems}</span>
            <div
                className="relative w-full h-[400px] md:h-[520px] min-[1700px]:h-[620px] flex items-center justify-center overflow-hidden cursor-default"
                style={{ touchAction: 'pan-y pinch-zoom' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={cancelGesture}
                onLostPointerCapture={cancelGesture}
                onClickCapture={(event) => {
                    if (event.detail !== 0 && suppressClick.current && !(event.target as Element).closest('button')) {
                        event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
                    }
                }}
            >
                {/* Items */}
                <div className="relative w-full max-w-7xl h-[360px] md:h-[460px] min-[1700px]:h-[560px]">
                    {visibleIndices.map((index) => {
                        const artist = artists[index];
                        const { style } = getStyles(index);
                        return (
                            <div
                                key={artist.id}
                                style={style}
                                className="carousel-slide h-full w-[92vw] max-w-[640px] min-[1700px]:max-w-[780px] min-[1900px]:max-w-[860px]"
                                aria-hidden={index !== currentIndex}
                            >
                                <Link
                                    to={`/${artist.type === 'gallery' ? 'gallery' : 'artist'}/${artist.id}/`}
                                    state={{ from: 'home', slideIndex: index }}
                                    tabIndex={index === currentIndex ? 0 : -1}
                                    aria-label={`Explore ${artist.name}`}
                                    className="block h-full"
                                    draggable={false}
                                >
                                    <ArtistCard {...artist} priority={index === currentIndex} />
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* Controls */}
                <CarouselArrow direction="prev" onClick={prev} className="left-4 md:left-10" />
                <CarouselArrow direction="next" onClick={next} className="right-4 md:right-10" />
            </div>
        </div>
    );
};
