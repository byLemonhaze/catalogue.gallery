import { useEffect, useRef, useState } from 'react';
import { dispatchMedia, type DispatchPost } from '../lib/dispatch';
export function DispatchMedia({post}: {post: DispatchPost}) {
    const media = dispatchMedia(post);
    const [selected,setSelected] = useState<number|null>(null);
    const dialog = useRef<HTMLDialogElement>(null);
    const isOpen = selected !== null;
    useEffect(()=>{
        if (!isOpen) return;
        const node=dialog.current; const previous=document.body.style.overflow;
        document.body.style.overflow='hidden'; node?.showModal();
        return ()=>{node?.close();document.body.style.overflow=previous;};
    },[isOpen]);
    if (!media.length) return null;
    const move = (step:number)=>setSelected(value=>value === null ? null : (value+step+media.length)%media.length);
    return <section className="dispatch-media" aria-label="Images from this edition"><div className="dispatch-media-heading"><span className="eyebrow">In pictures</span><span className="eyebrow">{media.length} images · Select to expand</span></div><div className={`dispatch-contact-sheet ${media.length===1?'single':''}`}>{media.map((item,index)=><button key={item.url} className="dispatch-plate-button" onClick={()=>setSelected(index)} aria-label={`Expand ${item.label.toLowerCase()}`}><img src={item.url} alt={item.alt} loading="eager" width="1200" height="1200"/><span>{item.label}<span className="plate-expand" aria-hidden="true">+</span></span></button>)}</div><dialog ref={dialog} className="dispatch-lightbox" aria-label="Edition image viewer" onCancel={()=>setSelected(null)} onClick={event=>{if(event.target===event.currentTarget)setSelected(null);}} onKeyDown={event=>{if(event.key==='ArrowRight'){event.preventDefault();move(1);}if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}}}>{selected!==null && <div className="dispatch-lightbox-inner"><header><span>{media[selected].label} · {selected+1} / {media.length}</span><button onClick={()=>setSelected(null)} autoFocus>Close</button></header><img src={media[selected].url} alt={media[selected].alt}/>{media.length>1 && <footer><button onClick={()=>move(-1)}>Previous image</button><button onClick={()=>move(1)}>Next image</button></footer>}</div>}</dialog></section>;
}
