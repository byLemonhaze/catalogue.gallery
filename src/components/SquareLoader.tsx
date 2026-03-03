import type { CSSProperties } from 'react';

interface SquareLoaderProps {
    className?: string;
    label?: string;
    strokeWidth?: number;
    drift?: boolean;
}

export function SquareLoader({ className = '', label = 'Loading', strokeWidth = 1.5, drift = false }: SquareLoaderProps) {
    const style = {
        '--catalogue-loader-stroke': `${strokeWidth}px`,
    } as CSSProperties;

    return (
        <span
            role="status"
            aria-label={label}
            className={`catalogue-square-loader relative inline-flex items-center justify-center shrink-0 ${drift ? 'catalogue-square-loader--drift' : ''} ${className}`.trim()}
            style={style}
        >
            <svg aria-hidden="true" className="catalogue-square-loader__svg" viewBox="0 0 24 24" fill="none">
                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    pathLength="100"
                    className="catalogue-square-loader__stroke"
                />
            </svg>
        </span>
    );
}
