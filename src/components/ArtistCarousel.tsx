import React, { useState, useEffect } from 'react';
import { ArtistCard } from './ArtistCard';
import { useNavigate } from 'react-router-dom';
import { urlFor } from '../sanity/image';

interface ArtistCarouselProps {
    artists: any[];
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    onGlowColor?: (rgb: string) => void;
}

export const ArtistCarousel: React.FC<ArtistCarouselProps> = ({ artists, initialIndex = 0, onIndexChange, onGlowColor }) => {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Add "Coming Soon" as a virtual item
    const totalItems = artists.length;

    const next = () => {
        setActiveIndex((current: number) => {
            const newIndex = (current + 1) % totalItems;
            onIndexChange?.(newIndex);
            return newIndex;
        });
    };

    const prev = () => {
        setActiveIndex((current: number) => {
            const newIndex = (current - 1 + totalItems) % totalItems;
            onIndexChange?.(newIndex);
            return newIndex;
        });
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-play
    useEffect(() => {
        const timer = setTimeout(() => {
            next();
        }, 5000); // 5 seconds auto-switch
        return () => clearTimeout(timer);
    }, [activeIndex]);

    // Sample dominant color from active artist thumbnail
    useEffect(() => {
        if (!onGlowColor) return;
        const artist = artists[activeIndex];
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
    }, [activeIndex, artists, onGlowColor]);

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

    // Calculate position for each item relative to active index
    const getStyles = (index: number) => {
        // Handle circular distance logic
        let diff = index - activeIndex;
        // Adjust for wrapping
        if (diff > totalItems / 2) diff -= totalItems;
        if (diff < -totalItems / 2) diff += totalItems;

        const isActive = diff === 0;
        const isPrev = diff === -1;
        const isNext = diff === 1;

        // Base styles
        let style: React.CSSProperties = {
            transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0,
            zIndex: 0,
            pointerEvents: 'none',
            scale: '0.8',
            filter: 'blur(5px) grayscale(100%)',
        };

        if (isActive) {
            style = {
                ...style,
                opacity: 1,
                zIndex: 20,
                pointerEvents: 'auto',
                scale: '1',
                filter: 'blur(0px) grayscale(0%)',
                transform: `translateX(calc(-50% + ${dragOffset}px))`,
            };
        } else if (isPrev) {
            style = {
                ...style,
                opacity: 0.3,
                zIndex: 10,
                pointerEvents: 'none',
                transform: `translateX(calc(-100% + ${dragOffset}px)) scale(0.9)`, // Adjusted for visibility
            };
        } else if (isNext) {
            style = {
                ...style,
                opacity: 0.3,
                zIndex: 10,
                pointerEvents: 'none',
                transform: `translateX(calc(0% + ${dragOffset}px)) scale(0.9)`, // Adjusted for visibility
            };
        }

        return { style, diff };
    };

    return (
        <div
            className="relative w-full h-[450px] md:h-[560px] flex items-center justify-center overflow-hidden mt-0 cursor-default"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Items */}
            <div className="relative w-full max-w-7xl h-[380px] md:h-[500px]">
                {artists.map((artist, index) => {
                    const { style } = getStyles(index);
                    return (
                        <div
                            key={artist.id}
                            style={style}
                            className="w-[95vw] md:w-[600px] h-full"
                            onClick={() => {
                                if (index === activeIndex) {
                                    // Internal navigation to Artist Frame
                                    const path = artist.type === 'gallery' ? `/gallery/${artist.id}` : `/artist/${artist.id}`;
                                    navigate(path, { state: { from: 'home', slideIndex: index } });
                                } else {
                                    // Just rotate to it
                                    setActiveIndex(index);
                                }
                            }}
                        >
                            <ArtistCard {...artist} />
                        </div>
                    );
                })}


            </div>

            {/* Controls - Side Navigation */}
            <button
                onClick={prev}
                className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-white transition-colors duration-300 cursor-pointer"
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button
                onClick={next}
                className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-white transition-colors duration-300 cursor-pointer"
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30">
                <span className="font-mono text-[11px] tracking-[0.15em] text-white/35 select-none">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(totalItems).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};
