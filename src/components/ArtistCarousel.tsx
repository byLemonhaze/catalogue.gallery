import React, { useState, useEffect, useCallback } from 'react';
import { ArtistCard } from './ArtistCard';
import { useNavigate } from 'react-router-dom';
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
            className={`group absolute top-1/2 z-30 -translate-y-1/2 cursor-pointer appearance-none rounded-none border-0 bg-transparent p-0 text-white/28 transition-colors duration-300 hover:text-white ${className}`}
        >
            <span className={`flex items-center ${isPrev ? '' : 'justify-end'}`}>
                {isPrev && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                )}
                <span className="mx-2 h-px w-8 bg-current opacity-25 transition-opacity duration-300 group-hover:opacity-70 md:w-12" />
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
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
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

    // Keyboard navigation — stable deps via useCallback
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prev, next]);

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

    // Swipe handlers
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsDragging(true);
        setDragOffset(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const currentClientX = e.targetTouches[0].clientX;
        setTouchEnd(currentClientX);
        const offset = currentClientX - touchStart;
        setDragOffset(offset);
    };

    const onTouchEnd = () => {
        setIsDragging(false);
        if (!touchStart || !touchEnd) {
            setDragOffset(0);
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            next();
        } else if (isRightSwipe) {
            prev();
        }

        setDragOffset(0);
        setTouchStart(null);
        setTouchEnd(null);
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
            : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease, filter 320ms ease';

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
        <div className="w-full flex flex-col items-center">
            <div
                className="relative w-full h-[400px] md:h-[520px] flex items-center justify-center overflow-hidden cursor-default"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Items */}
                <div className="relative w-full max-w-7xl h-[360px] md:h-[460px]">
                    {visibleIndices.map((index) => {
                        const artist = artists[index];
                        const { style } = getStyles(index);
                        return (
                            <div
                                key={artist.id}
                                style={style}
                                className="w-[92vw] max-w-[640px] h-full"
                                onClick={() => {
                                    if (index === currentIndex) {
                                        const path = artist.type === 'gallery' ? `/gallery/${artist.id}` : `/artist/${artist.id}`;
                                        navigate(path, { state: { from: 'home', slideIndex: index } });
                                    } else {
                                        setActiveIndex(index);
                                    }
                                }}
                            >
                                <ArtistCard {...artist} />
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
