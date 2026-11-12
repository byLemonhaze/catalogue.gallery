import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DispatchPost } from '../lib/dispatch';
import { useMotionPreference } from '../hooks/useMotionPreference';

const pad = (value: number) => String(value).padStart(2, '0');

export function DispatchSignal({ post }: { post: DispatchPost }) {
    const [reduced] = useMotionPreference();
    const [held, setHeld] = useState(false);
    const [visible, setVisible] = useState(true);
    const [frame, setFrame] = useState({ index: 0, letters: 0 });
    const bulletinId = useId();
    const surface = useRef<HTMLAnchorElement>(null);
    const elapsed = useRef(0);
    const stories = (post.items?.length ? post.items : [{number:1, headline:post.summary || post.title, body:''}]).map(item => ({...item, headline:item.headline.replace(/^New on https?:\/\/(?:www\.)?catalogue\.gallery:\s*/i,'')}));
    const index = frame.index % stories.length;
    const story = stories[index];
    const transcript = stories.map(item => item.headline).join('. ');
    const words = story.headline.split(/\s+/);
    const wordCount = Math.min(words.length, Math.floor(frame.letters / Math.max(1, Array.from(story.headline).length) * (words.length + 1)));

    useEffect(() => {
        const element = surface.current;
        if (!element || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (reduced || !visible) return;
        const length = Array.from(story.headline).length;
        const typingTime = length * 42;
        const duration = typingTime + (index === stories.length - 1 ? 4200 : 2500);
        const timer = window.setInterval(() => {
            // Finish typing on hover/focus, then hold this story for reading.
            if (document.hidden || (held && elapsed.current >= typingTime)) return;
            elapsed.current += 40;
            if (elapsed.current >= duration) {
                elapsed.current = 0;
                setFrame(previous => ({index:(previous.index+1)%stories.length,letters:0}));
            } else {
                setFrame(previous => ({...previous,letters:Math.min(length,Math.floor(elapsed.current/42))}));
            }
        },40);
        return () => window.clearInterval(timer);
    }, [reduced,held,visible,story.headline,stories.length,index]);

    return <Link ref={surface} to={`/dispatch/${post.slug}/`} className="dispatch-signal dispatch-counterpoint" data-still={reduced || held}
        aria-label={`Read the edition: ${post.dateDisplay || post.title}`} aria-describedby={bulletinId}
        onPointerEnter={event=>{if(event.pointerType!=='touch')setHeld(true);}} onPointerLeave={()=>setHeld(false)}
        onFocus={()=>setHeld(true)} onBlur={()=>setHeld(false)}>
        <div className="signal-mast"><h2>DISPATCH</h2><span aria-hidden="true">{pad(index+1)} / {pad(stories.length)}</span></div>
        <div className="signal-top"><time dateTime={post.issueDate || post.publishedAt}>{post.dateDisplay || post.title}</time><span>Digital art, day by day.</span></div>
        {!reduced && <div className="signal-counter-stage" aria-hidden="true">
            <span className="signal-counter">{pad(index+1)}</span>
            <div className="signal-counter-copy">
                <div className="signal-sizing">{stories.map((item,i)=><span key={i}>{item.headline}</span>)}</div>
                <div className="signal-counter-text" key={index}>{words.map((word,i)=><span className="signal-word-mask" key={i}><span data-shown={i<wordCount}>{word}</span>{' '}</span>)}</div>
            </div>
        </div>}
        {reduced && <ol className="signal-index" aria-hidden="true">{stories.map((item,i)=><li key={`${item.number}-${i}`} data-active={i===index}><span>{pad(item.number)}</span><span>{item.headline}</span></li>)}</ol>}
        <span className="sr-only" id={bulletinId}>{transcript}</span>
        <span className="signal-foot">Read the edition<span className="signal-positions" aria-hidden="true">{stories.map((_,i)=><i key={i} data-active={i===index}/>)}</span></span>
    </Link>;
}
