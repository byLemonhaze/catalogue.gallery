import { useEffect, useRef, useState } from 'react';
import { SiteLink as Link } from './SiteLink';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { createProfileVortex } from '../lib/profileVortex';

function WorldPreview({ website, name, src, reduced }: { website: string; name: string; src: string; reduced: boolean }) {
    const [loaded,setLoaded]=useState(false);
    const [failed,setFailed]=useState(false);
    const iframe=useRef<HTMLIFrameElement>(null);
    const canvas=useRef<HTMLCanvasElement>(null);
    const renderer=useRef<ReturnType<typeof createProfileVortex>>(null);
    useEffect(()=>{
        if(reduced || !canvas.current)return;
        canvas.current.dataset.ready='pending';
        renderer.current=typeof WebGLRenderingContext==='undefined' ? null : createProfileVortex(canvas.current,src);
        if(!renderer.current)canvas.current.dataset.ready='false';
        return ()=>{renderer.current?.destroy();renderer.current=null;};
    },[src,reduced]);
    useEffect(()=>{renderer.current?.open(loaded && !failed);},[loaded,failed,reduced]);
    useEffect(()=>{
        if(loaded || failed)return;
        const frame=iframe.current;
        const fail=()=>setFailed(true);
        frame?.addEventListener('error',fail);
        const timeout=window.setTimeout(fail,10000);
        return ()=>{clearTimeout(timeout);frame?.removeEventListener('error',fail);};
    },[loaded,failed]);
    const open=loaded && !failed;
    return <span className="profile-portal" data-open={open} data-loaded={loaded && !failed} data-reduced={reduced} aria-hidden="true">
        {!failed && <iframe ref={iframe} src={website} title={`${name} website preview`} tabIndex={-1} sandbox="allow-scripts allow-same-origin" allow="autoplay 'none'; camera 'none'; microphone 'none'" referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)}/>}
        <img className="portal-fallback" src={src} alt="" draggable="false"/>
        {!reduced && <canvas ref={canvas}/>}
        {!loaded && !failed && <span className="portal-loading"/>}
    </span>;
}
export function ProfileSurface({ src, name, framed, to, state, website }: { src?: string; name: string; framed: boolean; to?: string; state?: unknown; website?: string }) {
    const [mounted,setMounted]=useState(false);
    const [reduced]=useMotionPreference();
    const canPreview=Boolean(src && to && website?.startsWith('https:'));
    // Paint the artist card first, then prepare its preview without waiting for hover.
    // Keeping this client-only preserves the static profile and avoids SSR embeds.
    useEffect(()=>{
        if(!canPreview)return;
        const frame=window.requestAnimationFrame(()=>setMounted(true));
        return ()=>window.cancelAnimationFrame(frame);
    },[canPreview]);
    const picture=<>{src ? <img src={src} alt={name} draggable="false"/> : <span>{name}</span>}
        {canPreview && mounted && <WorldPreview key={website} website={website!} name={name} src={src!} reduced={reduced}/>}</>;
    return <div className="profile-art">{to ? <Link className="profile-surface" data-framed={framed} to={to} state={state} aria-label={`Enter ${name}’s world`}>{picture}</Link> : <div className="profile-surface" data-framed={framed}>{picture}</div>}</div>;
}
