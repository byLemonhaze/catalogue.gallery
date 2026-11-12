import { captionCovered } from './windowsMotion';
import { captionPath, outlinePoints } from './captionMotion';
/** One GPU surface for the carousel. DOM images remain the accessible/CORS fallback. */
export type WarpMotion = { velocity: number; reduced: boolean };
const vertex = `
precision mediump float;
attribute vec2 aPosition;
uniform vec2 uViewport;
uniform vec4 uRect;
uniform float uVelocity;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
varying float vLight;
void main(){
 vUv=aPosition;
 vec2 p=aPosition-.5;
 float speed=clamp(uVelocity,-1.0,1.0);
 float bow=sin(aPosition.y*3.14159265);
 float wave=sin(aPosition.x*3.14159265);
 vec2 delta=aPosition-uPointer;
 float pool=exp(-dot(delta,delta)*12.0)*uHover;
 // The mesh itself bends: both the perimeter and the image pixels move.
 p.x+=bow*speed*.17;
 p.y+=wave*speed*.095+(aPosition.y-.5)*abs(speed)*.12;
 p+=delta*pool*.085*sin(length(delta)*14.0-uTime*2.4);
 p+=(clamp(uPointer,vec2(0.),vec2(1.))-.5)*uHover*.018;
 vec2 pixel=uRect.xy+(p+.5)*uRect.zw;
 gl_Position=vec4(pixel/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
 vLight=pool*.07+bow*speed*.035;
}`;
const fragment = `
precision mediump float;
uniform sampler2D uTexture;
uniform vec2 uCover;
uniform float uVelocity;
uniform float uOpacity;
uniform float uFrame;
varying vec2 vUv;
varying float vLight;
void main(){
 vec2 uv=(vUv-.5)*uCover+.5;
 float edge=pow(abs(vUv.x-.5)*2.,4.);
 vec2 split=vec2(uVelocity*.004*edge,0.);
 vec4 c=texture2D(uTexture,uv);
 c.r=texture2D(uTexture,uv+split).r;
 c.b=texture2D(uTexture,uv-split).b;
 c.rgb+=vLight;
 float border=step(min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)),.012)*uFrame;
 c.rgb=mix(c.rgb,vec3(.04),border);
 gl_FragColor=vec4(c.rgb,c.a*uOpacity);
}`;
export function createWindowWarp(canvas: HTMLCanvasElement, stage: HTMLElement, motion: WarpMotion, selector = '.world-window') {
    canvas.dataset.renderer = 'initializing';
    if (typeof WebGLRenderingContext === 'undefined') { canvas.dataset.renderer = 'unsupported'; return null; }
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) { canvas.dataset.renderer = 'unavailable'; return null; }
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
        const shader = gl.createShader(type)!; shaders.push(shader);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Warp shader failed');
        return shader;
    };
    const program = gl.createProgram()!;
    try {
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Warp linking failed');
    } catch (error) {
        canvas.dataset.renderer = 'shader-error'; console.warn('Catalogue image renderer:', error);
        shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program); return null;
    }
    canvas.dataset.renderer = 'webgl';
    const mesh: number[] = [], steps = 32;
    for (let y = 0; y < steps; y++) for (let x = 0; x < steps; x++) {
        for (const [dx, dy] of [[0,0],[1,0],[0,1],[0,1],[1,0],[1,1]]) mesh.push((x+dx)/steps,(y+dy)/steps);
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
    gl.useProgram(program);
    const attribute = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    const uniform = (name: string) => gl.getUniformLocation(program,name);
    const uniforms = Object.fromEntries(['uViewport','uRect','uVelocity','uPointer','uHover','uTime','uTexture','uCover','uOpacity','uFrame'].map(name => [name, uniform(name)]));
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const textures = new Map<string, { texture: WebGLTexture | null; width: number; height: number; touched: number }>();
    let pointer = { x: 0, y: 0 }, pointerInside = false, hover = 0, raf = 0, disposed = false, visible = true;
    const onPointer = (event: PointerEvent) => { pointer = {x:event.clientX,y:event.clientY}; pointerInside = true; };
    const onLeave = () => { pointerInside = false; };
    stage.addEventListener('pointermove',onPointer); stage.addEventListener('pointerleave',onLeave);
    const restoreImages = () => stage.querySelectorAll('[data-warp-ready]').forEach(element => element.removeAttribute('data-warp-ready'));
    const lost = (event: Event) => { event.preventDefault(); disposed=true; cancelAnimationFrame(raf); restoreImages(); };
    canvas.addEventListener('webglcontextlost',lost);
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {visible=entries[0].isIntersecting;}) : null;
    observer?.observe(stage);
    const render = (time: number) => {
        if (disposed) return;
        raf=requestAnimationFrame(render);
        if (!visible || document.hidden || stage.closest('[inert]')) return;
        const bounds = stage.getBoundingClientRect(), dpr=Math.min(devicePixelRatio || 1, 1.75);
        if (!bounds.width || !bounds.height) return;
        const width=Math.round(bounds.width*dpr),height=Math.round(bounds.height*dpr);
        if (canvas.width!==width || canvas.height!==height) { canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height); }
        gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
        if (motion.reduced) { canvas.dataset.textureStatus='reduced'; restoreImages(); return; }
        gl.uniform2f(uniforms.uViewport,bounds.width,bounds.height);
        gl.uniform1f(uniforms.uVelocity,motion.velocity);
        gl.uniform1f(uniforms.uTime,time*.001);
        hover += ((pointerInside ? 1 : 0)-hover)*.08;
        const cards=Array.from(stage.querySelectorAll<HTMLElement>(selector)).sort((a,b)=>Number(a.style.zIndex)-Number(b.style.zIndex));
        const shapes = cards.map(card => {
            const image = card.querySelector('img');
            const rect = (image || card).getBoundingClientRect();
            const points = outlinePoints(rect.width, rect.height, motion.velocity,
                {x:(pointer.x-rect.left)/Math.max(1,rect.width),y:(pointer.y-rect.top)/Math.max(1,rect.height)},hover,time*.001);
            const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
            return {card,points,rect:{left:rect.left+Math.min(...xs),right:rect.left+Math.max(...xs),top:rect.top+Math.min(...ys),bottom:rect.top+Math.max(...ys)},depth:Number(card.style.zIndex)};
        });
        for (const card of cards) {
            const img=card.querySelector('img'); if (!img) continue;
            const src=img.currentSrc || img.src;
            let entry=textures.get(src);
            if (!entry) {
                entry={texture:null,width:1,height:1,touched:time}; textures.set(src,entry);
                const cached=entry, image=new Image(); image.crossOrigin='anonymous';
                image.onerror=()=>{ canvas.dataset.textureStatus='load-error'; };
                image.onload=()=>{
                    canvas.dataset.textureStatus='loaded';
                    if(disposed || textures.get(src)!==cached) return;
                    const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
                    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
                    try { gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image); cached.texture=texture;cached.width=image.width;cached.height=image.height; }
                    catch { canvas.dataset.textureStatus='upload-error'; gl.deleteTexture(texture); }
                };
                // Same-origin delivery avoids CDN CORS/cache inconsistencies for GPU textures.
                const textureUrl = new URL(src, window.location.href);
                if (textureUrl.hostname === 'cdn.sanity.io' && textureUrl.pathname.startsWith('/images/ebj9kqfo/production/')) {
                    image.src='/media/artist?asset='+encodeURIComponent(textureUrl.pathname.split('/').pop()!)+ '&w=900';
                } else image.src=textureUrl.href;
            }
            entry.touched=time;
            if (!entry.texture) continue;
            const rect=img.getBoundingClientRect();
            card.dataset.warpReady='true';
            gl.bindTexture(gl.TEXTURE_2D,entry.texture); gl.uniform1i(uniforms.uTexture,0);
            gl.uniform4f(uniforms.uRect,rect.left-bounds.left,rect.top-bounds.top,rect.width,rect.height);
            const ratio=(rect.width/rect.height)/(entry.width/entry.height);
            gl.uniform2f(uniforms.uCover,Math.min(1,ratio),Math.min(1,1/ratio));
            gl.uniform2f(uniforms.uPointer,(pointer.x-rect.left)/rect.width,(pointer.y-rect.top)/rect.height);
            gl.uniform1f(uniforms.uHover,hover);
            gl.uniform1f(uniforms.uOpacity,Number(card.style.opacity));
            gl.uniform1f(uniforms.uFrame,card.dataset.framed==='true'?1:0);
            gl.drawArrays(gl.TRIANGLES,0,mesh.length/2);
            const shape = shapes.find(item => item.card === card)!;
            card.querySelector('.window-hit-surface path')?.setAttribute('d', shape.points.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')+' Z');
            const caption = card.querySelector<HTMLElement>('.world-caption');
            const path = caption?.querySelector<SVGPathElement>('.caption-baseline');
            const text = caption?.querySelector<SVGTextElement>('text');
            if (path && text) {
                path.setAttribute('d', captionPath(rect.width, rect.height, motion.velocity,
                    { x: (pointer.x-rect.left)/rect.width, y: (pointer.y-rect.top)/rect.height }, hover, time*.001));
                // Fit long captions without splitting surnames; the full name remains in the link label.
                text.removeAttribute('textLength');
                if (text.getComputedTextLength() > rect.width - 16) {
                    text.setAttribute('textLength', String(Math.max(1, rect.width-16)));
                    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                }
                caption!.dataset.covered = String(captionCovered(text.getBoundingClientRect(), Number(card.style.zIndex), shapes));
            }
        }
        // Bound GPU memory when browsing hundreds of artists.
        for(const [src,entry] of textures) if(time-entry.touched>12000) { gl.deleteTexture(entry.texture);textures.delete(src); }
    };
    raf=requestAnimationFrame(render);
    return () => {
        disposed=true;cancelAnimationFrame(raf);observer?.disconnect();restoreImages();
        stage.removeEventListener('pointermove',onPointer);stage.removeEventListener('pointerleave',onLeave);canvas.removeEventListener('webglcontextlost',lost);
        textures.forEach(entry=>gl.deleteTexture(entry.texture));gl.deleteBuffer(buffer);shaders.forEach(shader=>gl.deleteShader(shader));gl.deleteProgram(program);
    };
}
