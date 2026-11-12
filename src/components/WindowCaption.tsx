import { useId } from 'react';
export function WindowCaption({ name }: { name: string }) {
    const id = useId().replace(/:/g, '');
    return <><svg className="window-hit-surface" aria-hidden="true" focusable="false"><path/></svg><span className="world-caption">
        <span className="caption-fallback">{name}</span>
        <svg className="caption-curve" aria-hidden="true" focusable="false">
            <defs><path id={id} className="caption-baseline" d="M 0 16 L 1000 16" /></defs>
            <text><textPath href={`#${id}`} startOffset="8">{name}</textPath></text>
        </svg>
    </span></>;
}
