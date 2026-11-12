import { useEffect, useRef, useState } from 'react';
import archive from '../data/dispatch-archive.json';
import { useMotionPreference } from '../hooks/useMotionPreference';
import './dispatch-studies.css';

// A separate Vite entry for review. Not imported by the production application.
const edition = archive[0];
const headlines = edition.items.map(item => item.headline.replace(/^New on https?:\/\/(?:www\.)?catalogue\.gallery:\s*/i, ''));
const issueHref = `/dispatch/${edition.slug}/`;
const number = (value: number) => String(value).padStart(2, '0');
const directions = [
  { name: 'Phosphor', kind: 'phosphor', colour: 'Mineral green', note: 'The closest to Matrix. A sharp phosphor terminal, accumulating the day’s headlines line by line. A faint screen texture, no falling-code wallpaper.' },
  { name: 'News reel', kind: 'reel', colour: 'Ice blue', note: 'An upright news instrument. One headline types into the centre while the whole transcript travels through a fixed reading window.' },
  { name: 'Terminal poster', kind: 'poster', colour: 'Acid yellow', note: 'A bolder object in the rail. Oversized mono type gives one headline the stage; the complete edition stays visible in a compact index below.' },
  { name: 'Scan index', kind: 'scanner', colour: 'Celadon', note: 'A reading head moves through a precise, numbered index. The active story is cut out in pale green; the others remain quiet and readable.' },
  { name: 'Afterimage', kind: 'afterimage', colour: 'Soft ultraviolet', note: 'A text-led signal with a narrow violet margin and a fine cursor. Colour belongs to the typography; the surface stays flat, dark and sharp.' },
  { name: 'Night wire', kind: 'wire', colour: 'Warm amber', note: 'A stripped-back newswire. Headlines arrive as indented messages alongside a continuous vertical rail, like a cultural dispatch being received.' },
] as const;
type Direction = typeof directions[number];

function Study({ direction, paused, showAll }: { direction: Direction; paused: boolean; showAll: boolean }) {
  const [motionReduced] = useMotionPreference();
  const reduced = motionReduced || showAll;
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);
  const surface = useRef<HTMLAnchorElement>(null);
  const durations = headlines.map(text => Array.from(text).length * 42 + 2500);
  const total = durations.reduce((sum, value) => sum + value, 0) + 4200;
  let remaining = tick % total;
  let active = 0;
  while (active < headlines.length - 1 && remaining >= durations[active]) remaining -= durations[active++];
  const letters = reduced ? Infinity : Math.floor(remaining / 42);
  const typed = Array.from(headlines[active]).slice(0, letters).join('');

  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: 0.15 });
    if (surface.current) observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused || reduced || !visible) return;
    const timer = window.setInterval(() => { if (!document.hidden) setTick(value => value + 60); }, 60);
    return () => window.clearInterval(timer);
  }, [paused, reduced, visible]);

  const isHero = direction.kind === 'poster' || direction.kind === 'reel';
  const caret = <span className="study-caret" data-paused={paused || reduced} />;
  const line = (index: number) => index === active && !reduced ? <>{typed}{caret}</> : headlines[index];
  return <a ref={surface} className={`dispatch-study ds-${direction.kind}`} href={issueHref}
    aria-label={`Read Dispatch, ${edition.dateDisplay}`} data-paused={paused || reduced}>
    <div aria-hidden="true" className="study-visual">
      <header className="study-mast"><span><i />DISPATCH</span><span>{number(active + 1)} / {number(headlines.length)}</span></header>
      <div className="study-dateline"><time>{edition.issueDate.replaceAll('-', '.')}</time><span>Digital art, day by day.</span></div>
      {direction.kind === 'reel' && <div className="reel-window">
        <div className="reel-track" style={{ transform: `translateY(-${active * 164}px)` }}>
          {headlines.map((text, index) => <div className="reel-story" data-active={index === active} key={text}><small>{number(index + 1)}</small><span>{line(index)}</span></div>)}
        </div>
        <span className="reel-readhead" />
      </div>}
      {direction.kind === 'poster' && <div className="poster-headline"><span className="poster-sizing">{headlines.map(text => <span key={text}>{text}</span>)}</span><span className="poster-ghost">{headlines[active]}</span><span className="poster-typed">{typed}{!reduced && caret}</span></div>}
      {!isHero && <ol className="study-lines">{headlines.map((text, index) => <li key={text} data-active={index === active} data-future={index > active && !reduced}>
        <span className="study-line-number">{number(index + 1)}{direction.kind === 'wire' ? ' /' : ''}</span>
        <span className="study-line-text"><span className="study-measure">{text}</span><span className="study-ink">{line(index)}</span></span>
      </li>)}</ol>}
      {isHero && <ol className="study-index">{headlines.map((text, index) => <li key={text} data-active={index === active}><span>{number(index + 1)}</span>{text}</li>)}</ol>}
      {direction.kind === 'afterimage' && <div className="signal-register">{'▁ ▂ ▄ ▂ ▁ ▃ ▆ ▃ ▂ ▅ ▁ ▂ ▄ ▂ ▁'}<span>CATALOGUE / DAILY</span></div>}
      <footer className="study-footer"><span>Read the edition</span><span className="study-endmark">■</span></footer>
      <div className="study-progress"><span style={{ width: `${reduced ? 100 : (tick % total) / total * 100}%` }} /></div>
    </div>
    <span className="study-sr">{headlines.join(' · ')}</span>
  </a>;
}

export function DispatchStudies() {
  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [width, setWidth] = useState(390);
  return <>
    <header className="review-header"><a href="/">CATALOGUE<span>.gallery</span></a><span>LOCAL DESIGN STUDIES / 01—06</span></header>
    <main className="review-main">
      <div className="review-intro"><p>THE DAILY SIGNAL</p><h1>Six ways to receive<br />the day.</h1><div>Only the Dispatch box. Same edition, six different voices.<br />Select a direction to inspect it at sidebar or mobile width.</div></div>
      <div className="review-controls">
        <div className="review-tabs" aria-label="Choose a design">
          <button aria-pressed={selected === null} onClick={() => setSelected(null)}>Compare all</button>
          {directions.map((direction, i) => <button key={direction.kind} aria-pressed={selected === i} onClick={() => setSelected(i)}>{number(i + 1)}<span> {direction.name}</span></button>)}
        </div>
        <div className="playback-controls"><button onClick={() => setPaused(value => !value)}>{paused ? 'Play' : 'Pause'} motion</button><button onClick={() => setRun(value => value + 1)}>Replay</button>
          <button aria-pressed={showAll} onClick={() => setShowAll(value => !value)}>{showAll ? 'Return to typing' : 'Show all text'}</button>
          {selected !== null && <label>Width <select value={width} onChange={event => setWidth(Number(event.target.value))}><option value="320">320 · narrow rail</option><option value="360">360 · compact</option><option value="390">390 · mobile</option><option value="460">460 · wide rail</option></select></label>}
        </div>
      </div>
      <div className={`review-grid ${selected !== null ? 'review-focused' : ''}`}>
        {directions.map((direction, i) => (selected === null || selected === i) && <section className="review-study" key={direction.kind}>
          <div className="review-caption"><span>{number(i + 1)} / {direction.name}</span><span>{direction.colour}</span></div>
          <div className="review-box" style={selected !== null ? { maxWidth: width } : undefined}><Study key={`${direction.kind}-${run}`} direction={direction} paused={paused} showAll={showAll} /></div>
          <div className="review-note"><p>{direction.note}</p>{selected === null && <button onClick={() => setSelected(i)}>Inspect {number(i + 1)}</button>}</div>
        </section>)}
      </div>
      <footer className="review-bottom">November 11 edition · Real headlines · Click a box to open the edition<br />Local review only. Homepage and production remain unchanged.</footer>
    </main>
  </>;
}
