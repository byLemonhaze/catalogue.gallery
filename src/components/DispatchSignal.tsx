import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DispatchPost } from '../lib/dispatch';
import { useMotionPreference } from '../hooks/useMotionPreference';

export function DispatchSignal({ post }: { post: DispatchPost }) {
    const [reduced] = useMotionPreference();
    const [held, setHeld] = useState(false);
    const [visible, setVisible] = useState(true);
    const [frame, setFrame] = useState({ index: 0, letters: 0 });
    const bulletinId = useId();
    const surface = useRef<HTMLAnchorElement>(null);
    const elapsed = useRef(0);
    const stories = (post.items?.length ? post.items : [{number:1, headline:post.summary || post.title, body:''}]).map(item => ({...item, headline:item.headline.replace(/^New on https?:\/\/(?:www\.)?catalogue\.gallery:\s*/i,'')}));
    const story = stories[frame.index % stories.length];
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
        const typingTime = length * 38;
        const last = frame.index === stories.length - 1;
        const duration = typingTime + (last ? 6000 : 700);
        const timer = window.setInterval(() => {
            if (document.hidden || (held && last && elapsed.current >= typingTime)) return;
            elapsed.current += 40;
            if (elapsed.current >= duration) {
                elapsed.current = 0;
                setFrame(previous => ({index:(previous.index+1)%stories.length,letters:0}));
            } else {
                setFrame(previous => ({...previous,letters:Math.min(length,Math.floor(elapsed.current/38))}));
            }
        },40);
        return () => window.clearInterval(timer);
    }, [reduced,held,visible,story.headline,stories.length,frame.index]);
    return <Link ref={surface} to={`/dispatch/${post.slug}/`} className="dispatch-signal" data-still={reduced || held}
        aria-label={`Read the edition: ${post.dateDisplay || post.title}`} aria-describedby={bulletinId}
        onPointerEnter={event=>{if(event.pointerType!=='touch')setHeld(true);}} onPointerLeave={()=>setHeld(false)}
        onFocus={()=>setHeld(true)} onBlur={()=>setHeld(false)}>
        <div className="signal-top"><time dateTime={post.issueDate || post.publishedAt}>{post.dateDisplay || post.title}</time><span>{String(stories.length).padStart(2,'0')} stories</span></div>
        <ol className="signal-bulletin" aria-hidden="true">
            {stories.map((item,index)=>{
                const letters = Array.from(item.headline);
                const complete = reduced || index < frame.index;
                const shown = complete ? item.headline : index === frame.index ? letters.slice(0,frame.letters).join('') : '';
                const typing = !reduced && index === frame.index && frame.letters < letters.length;
                return <li className="signal-row" data-active={index===frame.index} key={`${item.number}-${index}`}>
                    <span className="signal-number">{String(item.number).padStart(2,'0')}</span>
                    <span className="signal-headline">
                        <span className="signal-measure">{item.headline}</span>
                        <span className="signal-typed">{shown}{typing && <span className="signal-caret"/>}</span>
                    </span>
                </li>;
            })}
        </ol>
        <span className="sr-only" id={bulletinId}>{stories.map(item=>item.headline).join('. ')}</span>
        <span className="signal-foot">Read the edition<span className="signal-square" aria-hidden="true"/></span>
    </Link>;
}
