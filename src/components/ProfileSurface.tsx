import { useEffect, useRef, useState } from 'react';
import { SiteLink as Link } from './SiteLink';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { createProfileVortex } from '../lib/profileVortex';

function WorldPreview({ website, name, src, reduced, returningFromWorld }: { website: string; name: string; src: string; reduced: boolean; returningFromWorld: boolean }) {
    const [loaded,setLoaded]=useState(false);
    const [failed,setFailed]=useState(false);
    const [coverReady, setCoverReady] = useState(false);
    const [rendererState, setRendererState] = useState<'pending' | 'ready' | 'fallback'>('pending');
    const cover = useRef<HTMLImageElement>(null);
    const iframe=useRef<HTMLIFrameElement>(null);
    const canvas=useRef<HTMLCanvasElement>(null);
    const renderer=useRef<ReturnType<typeof createProfileVortex>>(null);
    useEffect(() => {
        const image = cover.current;
        if (!image) return;
        let cancelled = false, paint = 0;
        const prepare = async () => {
            try {
                if (image.decode) await image.decode();
                if (!cancelled && image.naturalWidth > 0) {
                    // Keep the opaque cover through a paint opportunity, including cached assets.
                    paint = requestAnimationFrame(() => { if (!cancelled) setCoverReady(true); });
                }
            } catch { /* A failed cover never authorizes revealing the iframe. */ }
        };
        image.addEventListener('load', prepare);
        if (image.complete && image.naturalWidth > 0) void prepare();
        return () => { cancelled = true; cancelAnimationFrame(paint); image.removeEventListener('load', prepare); };
    }, [src]);
    useEffect(() => {
        let cancelled = false;
        const update = (state: 'ready' | 'fallback') => { if (!cancelled) setRendererState(state); };
        if (!reduced && !returningFromWorld && canvas.current && typeof WebGLRenderingContext !== 'undefined') {
            canvas.current.dataset.ready = 'pending';
            renderer.current = createProfileVortex(canvas.current, src, update);
        }
        if (!renderer.current) queueMicrotask(() => update('fallback'));
        // GPU/proxy loading must not hold a decoded artwork forever. Fall back to its fade.
        const timeout = setTimeout(() => {
            if (canvas.current?.dataset.ready === 'pending') {
                renderer.current?.destroy(); renderer.current = null;
                canvas.current.dataset.ready = 'false'; update('fallback');
            }
        }, 10000);
        return () => { cancelled = true; clearTimeout(timeout); renderer.current?.destroy(); renderer.current = null; };
    }, [src, reduced, returningFromWorld]);
    const open = loaded && coverReady && !failed && (reduced || rendererState !== 'pending');
    useEffect(() => { renderer.current?.open(open); }, [open, rendererState]);
    useEffect(()=>{
        if(loaded || failed)return;
        const frame=iframe.current;
        const fail=()=>setFailed(true);
        frame?.addEventListener('error',fail);
        const timeout=window.setTimeout(fail,10000);
        return ()=>{clearTimeout(timeout);frame?.removeEventListener('error',fail);};
    },[loaded,failed]);
    return <span className="profile-portal" data-open={open} data-loaded={loaded && !failed} data-cover-ready={coverReady} data-renderer={rendererState} data-reduced={reduced} data-restored={returningFromWorld} aria-hidden="true">
        {!failed && <iframe ref={iframe} src={website} title={`${name} website preview`} tabIndex={-1} sandbox="allow-scripts allow-same-origin" allow="autoplay 'none'; camera 'none'; microphone 'none'" referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)}/>}
        <img ref={cover} className="portal-fallback" src={src} alt="" draggable="false"/>
        {!reduced && !returningFromWorld && <canvas ref={canvas}/>}
        {!open && !failed && <span className="portal-loading"/>}
    </span>;
}
export function ProfileSurface({ src, name, framed, to, state, website, returningFromWorld = false }: { src?: string; name: string; framed: boolean; to?: string; state?: unknown; website?: string; returningFromWorld?: boolean }) {
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
        {canPreview && mounted && <WorldPreview key={`${website}|${src}`} website={website!} name={name} src={src!} reduced={reduced} returningFromWorld={returningFromWorld}/>}</>;
    return <div className="profile-art">{to ? <Link className="profile-surface" data-framed={framed} to={to} state={state} aria-label={`Enter ${name}’s world`}>{picture}</Link> : <div className="profile-surface" data-framed={framed}>{picture}</div>}</div>;
}
