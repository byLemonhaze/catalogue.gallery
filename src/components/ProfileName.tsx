import { useEffect, useRef } from 'react';

/** Fit the name to its own column, never split a surname between letters. */
export function ProfileName({ name }: { name: string }) {
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        const element = heading.current;
        if (!element) return;
        let cancelled = false;
        const fit = () => {
            if (cancelled) return;
            element.style.removeProperty('--profile-name-size');
            element.style.whiteSpace = 'nowrap';
            const max = parseFloat(getComputedStyle(element).fontSize);
            const measured = element.scrollWidth;
            const available = element.clientWidth;
            if (!available) return;
            const size = Math.min(max, max * available / Math.max(measured, 1) * .98);
            element.style.setProperty('--profile-name-size', `${Math.max(22, size)}px`);
            if (size < 22) {
                element.style.whiteSpace = 'normal';
                // Exceptionally long names wrap between whole words only.
                const longest = Math.max(...Array.from(element.children).map(word => word.getBoundingClientRect().width));
                if (longest > available) element.style.setProperty('--profile-name-size', `${22 * available / longest}px`);
            }
        };
        fit();
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
        if (element.parentElement) observer?.observe(element.parentElement);
        void document.fonts?.ready.then(fit);
        return () => { cancelled = true; observer?.disconnect(); };
    }, [name]);
    return <h1 ref={heading} id="profile-title" aria-label={name} className="profile-name">{name.split(/\s+/).map((word,index) => <span key={index}>{index > 0 ? ' ' : ''}{word}</span>)}</h1>;
}
