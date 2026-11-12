/** A transparent spiral aperture in the artwork; the live DOM iframe sits behind it. */
const vertex = `attribute vec2 aPosition; varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition.x,-aPosition.y,0.,1.);}`;
const fragment = `precision mediump float;
varying vec2 vUv; uniform sampler2D uImage; uniform vec2 uCover; uniform float uProgress;
void main(){
 vec2 p=vUv-.5; float r=length(p); float a=atan(p.y,p.x);
 float t=uProgress; float energy=sin(t*3.14159265);
 // Spiral arms tear at different rates, then relax completely at either endpoint.
 float edge=t*.81 + energy*(.028*sin(a*5.-t*9.)+.014*sin(a*11.+r*16.-t*5.));
 float rim=exp(-abs(r-edge)*19.)*energy;
 float twist=rim*1.65;
 float radius=r+rim*.075;
 vec2 warped=vec2(cos(a+twist),sin(a+twist))*radius;
 vec2 uv=clamp(warped*uCover+.5,vec2(.001),vec2(.999));
 vec4 colour=texture2D(uImage,uv);
 // Fold shadow and narrow grazing highlight use the artwork's own colours.
 colour.rgb*=1.-rim*.48;
 colour.rgb+=rim*.13*max(0.,sin(a*3.+t*7.));
 float alpha=smoothstep(edge-.006,edge+.009,r);
 alpha=mix(1.,alpha,smoothstep(0.,.045,t));
 gl_FragColor=vec4(colour.rgb,alpha);
}`;
export function createProfileVortex(canvas: HTMLCanvasElement, src: string) {
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!gl) return null;
    const shaders: WebGLShader[]=[];
    const program=gl.createProgram()!;
    for(const [kind,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const){
        const shader=gl.createShader(kind)!; shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);return null;}
        gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);return null;}
    gl.useProgram(program);
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const cover=gl.getUniformLocation(program,'uCover'),progress=gl.getUniformLocation(program,'uProgress');
    let disposed=false,ready=false,raf=0,value=0,target=0,start=0,from=0;
    const image=new Image();image.crossOrigin='anonymous';
    function draw(time:number){
        raf=0;if(disposed || !ready || document.hidden)return;
        if(start){const fraction=Math.min(1,(time-start)/(target ? 1500 : 850));const eased=fraction*fraction*(3-2*fraction);value=from+(target-from)*eased;if(fraction===1)start=0;}
        const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
        canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));gl!.viewport(0,0,canvas.width,canvas.height);
        const ratio=(rect.width/rect.height)/(image.width/image.height);
        gl!.uniform2f(cover,Math.min(1,ratio),Math.min(1,1/ratio));gl!.uniform1f(progress,value);gl!.drawArrays(gl!.TRIANGLES,0,6);
        canvas.dataset.ready='true';
        if(start)raf=requestAnimationFrame(draw);
    }
    function wake(){if(!raf && !disposed)raf=requestAnimationFrame(draw);}
    image.onload=()=>{if(disposed)return;try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;if(start)start=performance.now();wake();}catch{canvas.dataset.ready='false';}};
    const url=new URL(src,window.location.href);
    image.src=url.hostname==='cdn.sanity.io' && url.pathname.startsWith('/images/ebj9kqfo/production/') ? '/media/artist?asset='+encodeURIComponent(url.pathname.split('/').pop()!)+'&w=1200' : url.href;
    const observer=new ResizeObserver(wake);observer.observe(canvas);
    const onVisibility=()=>{if(!document.hidden)wake();};document.addEventListener('visibilitychange',onVisibility);
    const onLoss=(event:Event)=>{event.preventDefault();canvas.dataset.ready='false';};canvas.addEventListener('webglcontextlost',onLoss);
    return {
        open(open:boolean){const next=open?1:0;if(target===next)return;target=next;from=value;start=performance.now();wake();},
        destroy(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);canvas.removeEventListener('webglcontextlost',onLoss);image.onload=null;gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}
    };
}
