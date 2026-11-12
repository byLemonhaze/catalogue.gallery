import {useEffect, useRef, useState} from 'react';
import archive from '../data/dispatch-archive.json';
import {useMotionPreference} from '../hooks/useMotionPreference';
import './dispatch-studies.css';
import './dispatch-second-studies.css';

const edition=archive[0];
const stories=edition.items.map(item=>item.headline.replace(/^New on https?:\/\/(?:www\.)?catalogue\.gallery:\s*/i,''));
const pad=(value:number)=>String(value).padStart(2,'0');
const directions=[
    {name:'Closed captions',kind:'captions',note:'A small cinema for the news. Centred captions arrive word by word; only the newest word glows pale citron. The frame almost disappears.'},
    {name:'Reading slit',kind:'slit',note:'The blue reel reduced to its essentials. A narrow opening, ice-blue mono text, a glimpse of the previous line. No coloured surface or duplicate index.'},
    {name:'Margin note',kind:'margin',note:'An editorial annotation. A tall story number, vermilion italic text and a fine rule. The sentence writes itself beside the number.'},
    {name:'The running line',kind:'running',note:'A wide-format news ribbon inside a small space. Oversized mint type travels horizontally at reading pace, with generous holds at both ends.'},
    {name:'Letter relay',kind:'relay',note:'A departure-board rhythm without the plastic tiles. Warm amber characters quietly turn into place on a neutral black field.'},
    {name:'Counterpoint',kind:'counterpoint',note:'A vertical masthead, a large neutral story counter and a lilac sentence revealed from the baseline. More graphic, less terminal.'},
] as const;
type Direction=typeof directions[number];

function Transcript({direction,paused,staticText,storyOverride}:{direction:Direction;paused:boolean;staticText:boolean;storyOverride:number|null}) {
    const [reduced]=useMotionPreference();
    const [tick,setTick]=useState(0);
    const [visible,setVisible]=useState(false);
    const [held,setHeld]=useState(false);
    const surface=useRef<HTMLAnchorElement>(null);
    const runner=useRef<HTMLSpanElement>(null);
    const [travel,setTravel]=useState(0);
    const durations=stories.map(text=>Math.max(6200,Array.from(text).length*110+2600));
    const total=durations.reduce((sum,value)=>sum+value,0);
    let time=tick%total, active=0;
    while(active<stories.length-1&&time>=durations[active])time-=durations[active++];
    if(storyOverride!==null){active=storyOverride;time=tick%durations[active];}
    const text=stories[active];
    const still=staticText||reduced;
    const progress=Math.min(1,time/(text.length*55));
    const count=still?text.length:Math.floor(progress*text.length);
    const words=text.split(' ');
    const wordCount=still?words.length:Math.floor(progress*(words.length+1));
    const runningProgress=still?0:Math.max(0,Math.min(1,(time-1400)/(durations[active]-3300)));
    useEffect(()=>{
        const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.2});
        if(surface.current)observer.observe(surface.current);
        return()=>observer.disconnect();
    },[]);
    useEffect(()=>{
        if(paused||still||!visible||held)return;
        const timer=window.setInterval(()=>{if(!document.hidden)setTick(value=>value+50);},50);
        return()=>window.clearInterval(timer);
    },[paused,still,visible,held]);
    useEffect(()=>{
        const el=runner.current;
        if(!el||!el.parentElement)return;
        const measure=()=>setTravel(Math.max(0,el.scrollWidth-el.parentElement!.clientWidth));
        measure();
        const observer=new ResizeObserver(measure);
        observer.observe(el);observer.observe(el.parentElement);
        return()=>observer.disconnect();
    },[text]);
    const caret=!still&&count<text.length&&<i className="v2-caret"/>;
    return <a ref={surface} href={`/dispatch/${edition.slug}/`} className={`v2-box v2-${direction.kind}`} data-still={still||paused||held} data-static={still}
        aria-label={`Read Dispatch: ${edition.dateDisplay}`} aria-describedby={`v2-${direction.kind}-transcript`}
        onPointerEnter={event=>{if(event.pointerType!=='touch')setHeld(true);}} onPointerLeave={()=>setHeld(false)} onFocus={()=>setHeld(true)} onBlur={()=>setHeld(false)}>
        <div className="v2-face" aria-hidden="true">
            <header className="v2-mast"><span>DISPATCH</span><span>{pad(active+1)}<b> / {pad(stories.length)}</b></span></header>
            <div className="v2-date"><time>{edition.issueDate.replaceAll('-','.')}</time><span>Digital art, day by day.</span></div>
            <div className="v2-stage">
                {direction.kind==='captions'&&<div className="v2-caption-text" key={active}>{words.map((word,i)=><span className={i===wordCount-1?'current':''} data-shown={i<wordCount} key={i}>{word} </span>)}</div>}
                {direction.kind==='slit'&&<div className="v2-slit-viewport"><div className="v2-slit-roll" style={{transform:`translateY(-${active*130}px)`}}>{stories.map((headline,i)=><div className="v2-slit-line" key={headline} data-active={i===active}><small>{pad(i+1)}</small><span>{i===active?text.slice(0,count):headline}{i===active&&caret}</span></div>)}</div></div>}
                {direction.kind==='margin'&&<><span className="v2-margin-number">{pad(active+1)}</span><div className="v2-margin-text"><span className="v2-reserve">{text}</span><span className="v2-written">{text.slice(0,count)}{caret}</span></div></>}
                {direction.kind==='running'&&<div className="v2-running-window"><span ref={runner} className="v2-running-text" style={{transform:`translateX(-${travel*runningProgress}px)`}}>{text}</span><span className="v2-running-rule"/></div>}
                {direction.kind==='relay'&&<div className="v2-relay-text" key={active}>{words.map((word,i)=>{const start=words.slice(0,i).join(' ').length+(i?1:0);return <span className="v2-word" key={i}>{Array.from(word).map((letter,j)=><span className="v2-letter" data-shown={start+j<count} key={j}>{letter}</span>)}{' '}</span>;})}</div>}
                {direction.kind==='counterpoint'&&<><span className="v2-counter">{pad(active+1)}</span><div className="v2-counter-text" key={active}>{words.map((word,i)=><span className="v2-word-mask" key={i}><span data-shown={i<wordCount}>{word}</span></span>)}</div></>}
            </div>
            <footer className="v2-footer"><span>Read the edition</span><span className="v2-position">{stories.map((_,i)=><i key={i} data-active={i===active}/>)}</span></footer>
        </div>
        <span className="study-sr" id={`v2-${direction.kind}-transcript`}>{stories.join(' ')}</span>
    </a>;
}

export function DispatchSecondStudies(){
    const [selected,setSelected]=useState<number|null>(null);
    const [paused,setPaused]=useState(false);
    const [staticText,setStaticText]=useState(false);
    const [run,setRun]=useState(0);
    const [story,setStory]=useState<number|null>(null);
    const [width,setWidth]=useState(360);
    return <div className="second-studies">
        <header className="review-header"><a href="/">CATALOGUE<span>.gallery</span></a><span>TRANSCRIPT STUDIES / 07—12</span></header>
        <main className="review-main">
            <div className="review-intro"><p>COLOUR IN THE WORDS. BLACK AROUND THEM.</p><h1>Less box.<br/>More voice.</h1><div>Six compact transcripts. No tinted panels. No static news list.<br/>The same five real headlines, six different ways to read them.</div></div>
            <div className="review-controls">
                <div className="review-tabs"><button aria-pressed={selected===null} onClick={()=>setSelected(null)}>Compare all</button>{directions.map((d,i)=><button aria-pressed={selected===i} onClick={()=>setSelected(i)} key={d.kind}>{pad(i+7)}<span> {d.name}</span></button>)}</div>
                <div className="playback-controls"><button onClick={()=>setPaused(!paused)}>{paused?'Play':'Pause'} motion</button><button onClick={()=>setRun(run+1)}>Replay</button><button aria-pressed={staticText} onClick={()=>setStaticText(!staticText)}>{staticText?'Animate':'Freeze full text'}</button>
                    <label>Story <select value={story??'auto'} onChange={e=>{setStory(e.target.value==='auto'?null:Number(e.target.value));setRun(run+1);}}><option value="auto">Auto cycle</option>{stories.map((_,i)=><option key={i} value={i}>{pad(i+1)}</option>)}</select></label>
                    {selected!==null&&<label>Width <select value={width} onChange={e=>setWidth(Number(e.target.value))}>{[320,360,390,460].map(w=><option key={w}>{w}</option>)}</select></label>}
                </div>
            </div>
            <div className={`review-grid ${selected!==null?'review-focused':''}`}>{directions.map((d,i)=>(selected===null||selected===i)&&<section className="review-study" key={d.kind}>
                <div className="review-caption"><span>{pad(i+7)} / {d.name}</span><span>TEXT STUDY</span></div>
                <div className="review-box" style={{maxWidth:selected!==null?width:undefined}}><Transcript key={`${d.kind}-${run}`} direction={d} paused={paused} staticText={staticText} storyOverride={story}/></div>
                <div className="review-note"><p>{d.note}</p>{selected===null&&<button onClick={()=>setSelected(i)}>Inspect {pad(i+7)}</button>}</div>
            </section>)}</div>
            <footer className="review-bottom"><a href="/design/dispatch/">Studies 01–06</a> · <a href="/">Current homepage</a><br/>Local review only. No homepage changes, commits or deployment in this round.</footer>
        </main>
    </div>;
}
