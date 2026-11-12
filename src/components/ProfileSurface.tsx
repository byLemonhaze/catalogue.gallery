import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { createProfileVortex } from '../lib/profileVortex';

function WorldPreview({ website, name, active, src, reduced }: { website: string; name: string; active: boolean; src: string; reduced: boolean }) {
    const [loaded,setLoaded]=useState(false);
    const [failed,setFailed]=useState(false);
    const canvas=useRef<HTMLCanvasElement>(null);
    const renderer=useRef<ReturnType<typeof createProfileVortex>>(null);
    useEffect(()=>{
        if(reduced || !canvas.current || typeof WebGLRenderingContext==='undefined')return;
        renderer.current=createProfileVortex(canvas.current,src);
        return ()=>{renderer.current?.destroy();renderer.current=null;};
    },[src,reduced]);
    useEffect(()=>{renderer.current?.open(active && loaded && !failed);},[active,loaded,failed,reduced]);
    useEffect(()=>{
        if(loaded)return;
        const timeout=window.setTimeout(()=>setFailed(true),10000);
        return ()=>clearTimeout(timeout);
    },[loaded]);
    const open=active && loaded && !failed;
    return <span className="profile-portal" data-open={open} data-loaded={loaded && !failed} data-reduced={reduced} aria-hidden="true">
        {!failed && <iframe src={website} title={`${name} website preview`} tabIndex={-1} sandbox="allow-scripts allow-same-origin" allow="autoplay 'none'; camera 'none'; microphone 'none'" referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>}
        <img className="portal-fallback" src={src} alt="" draggable="false"/>
        {!reduced && <canvas ref={canvas}/>}
        {active && !loaded && !failed && <span className="portal-loading"/>}
    </span>;
}
export function ProfileSurface({ src, name, framed, to, state, website }: { src?: string; name: string; framed: boolean; to?: string; state?: unknown; website?: string }) {
    const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[mounted,setMounted]=useState(false);
    const [reduced]=useMotionPreference();
    const active=hovered || focused;
    // A brief hover intent avoids loading other sites while the cursor just passes through.
    useEffect(()=>{
        const timer=window.setTimeout(()=>setMounted(active),active ? 160 : 900);
        return ()=>clearTimeout(timer);
    },[active]);
    const canPreview=Boolean(src && website?.startsWith('https:'));
    const picture=<>{src ? <img src={src} alt={name} draggable="false"/> : <span>{name}</span>}
        {canPreview && mounted && <WorldPreview key={website} website={website!} name={name} src={src!} active={active} reduced={reduced}/>}</>;
    return <div className="profile-art">{to ? <Link className="profile-surface" data-framed={framed} to={to} state={state} aria-label={`Enter ${name}’s world`}
        onPointerEnter={event=>{if(event.pointerType!=='touch')setHovered(true);}} onPointerLeave={()=>setHovered(false)}
        onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))setFocused(true);}} onBlur={()=>setFocused(false)}>{picture}</Link> : <div className="profile-surface" data-framed={framed}>{picture}</div>}</div>;
}
