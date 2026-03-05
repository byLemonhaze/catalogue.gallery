import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import JSZip from 'jszip';

export function Build() {
    const [step, setStep] = useState(1);

    // 1. Identity
    const [name, setName] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [pfp, setPfp] = useState(''); // This will store the Data URL for preview
    const [pfpFile, setPfpFile] = useState<File | null>(null);
    const [bio, setBio] = useState('');

    // 2. Career Highlights
    const [highlights, setHighlights] = useState<string[]>(['']);

    // 3. Press
    const [press, setPress] = useState<{ title: string; url: string }[]>([{ title: '', url: '' }]);

    // 4. Socials
    const [socials, setSocials] = useState<{ type: string; url: string }[]>([
        { type: 'twitter', url: '' }
    ]);

    // 5. Master JSON (Body of Work)
    const [jsonInput, setJsonInput] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('minimal');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [previewScale, setPreviewScale] = useState(0.4);

    // Simple effect to handle preview scaling
    const previewContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const containerWidth = previewContainerRef.current.offsetWidth - 128; // account for padding & bezels
                const scale = containerWidth / 1280;
                setPreviewScale(Math.min(scale, 0.55)); // Cap scale to prevent overflow
            }
        };

        // Use a slight delay to ensure container is rendered
        const timer = setTimeout(updateScale, 100);
        window.addEventListener('resize', updateScale);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, [previewMode, step]); // Re-scale if mode or step changes (layout shifts)

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    // Templates Configuration
    const templates = {
        minimal: {
            bg: "bg-white",
            text: "text-black",
            accent: "bg-black",
            font: "font-sans",
            desc: "Clean, high-contrast typography and negative space."
        },
        studio: {
            bg: "bg-[#0a0a0a]",
            text: "text-white",
            accent: "bg-purple-500",
            font: "font-mono",
            desc: "Technical, structured layout with sidebar focus."
        },
        vanta: {
            bg: "bg-black",
            text: "text-white/80",
            accent: "bg-zinc-800",
            font: "font-serif",
            desc: "Deep dark mode with sophisticated serif accents."
        },
        glass: {
            bg: "bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070')] bg-cover",
            text: "text-white",
            accent: "bg-white/10 backdrop-blur-md",
            font: "font-sans",
            desc: "Translucent layers over vibrant gradients."
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPfpFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPfp(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resolveArtworkUrl = (input: string) => {
        if (!input) return { url: "", isLive: false };

        // Ordinals Inscription ID (64 hex + i0)
        if (/^[a-fA-F0-9]{64}i[0-9]+$/.test(input)) {
            return { url: `https://ordinals.com/content/${input}`, isLive: true };
        }

        // IPFS
        if (input.startsWith('ipfs://')) {
            const hash = input.replace('ipfs://', '');
            return { url: `https://ipfs.io/ipfs/${hash}`, isLive: false };
        }

        // Art Blocks
        const artBlocksMatch = input.match(/artblocks\.io\/token\/(?:\d+\/)?(0x[a-fA-F0-9]+)\/(\d+)/);
        if (artBlocksMatch) {
            return { url: `https://generator.artblocks.io/${artBlocksMatch[1]}/${artBlocksMatch[2]}`, isLive: true };
        }
        if (input.includes('generator.artblocks.io')) {
            return { url: input, isLive: true };
        }

        // Tezos (objkt/fxhash) - Simple mapping for common generative platforms
        if (input.includes('objkt.com/asset') || input.includes('fxhash.xyz/gentk')) {
            // These usually need specific API resolution or iframes to their viewer
            return { url: input, isLive: true };
        }

        // Default: Check extension for live content
        const isLive = /\.(html|php|js)$/i.test(input) || !/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)$/i.test(input);

        return { url: input, isLive };
    };

    const buildJson = () => {
        const cleanHighlights = highlights.filter(h => h.trim());
        const cleanPress = press.filter(p => p.title.trim() && p.url.trim());
        const socialObj: Record<string, string> = {};
        socials.forEach(s => {
            if (s.url.trim()) socialObj[s.type] = s.url;
        });

        let artworks = [];
        if (jsonInput.trim()) {
            try {
                artworks = JSON.parse(jsonInput);
                if (!Array.isArray(artworks)) throw new Error("Must be an array");
            } catch {
                console.error("Invalid JSON content");
            }
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const finalObj = {
            id,
            name,
            subtitle,
            bio,
            pfp: pfpFile ? `assets/${pfpFile.name}` : "",
            socials: socialObj,
            highlights: cleanHighlights,
            press: cleanPress,
            template: selectedTemplate
        };

        return JSON.stringify({
            "ARTIST_ENTRY": finalObj,
            "PROVENANCE_DATA": artworks
        }, null, 2);
    };

    const handleDownload = async () => {
        if (!name.trim()) {
            alert("Artist Name is required");
            return;
        }

        const zip = new JSZip();
        const json = buildJson();
        const templateData = templates[selectedTemplate as keyof typeof templates];

        // 1. Generate index.html
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} | Universe</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,900;1,400&display=swap" rel="stylesheet">
</head>
<body class="${templateData.bg} ${templateData.text} min-h-screen selection:bg-purple-500/30">
    <div id="root" class="max-w-4xl mx-auto px-6 py-20 animate-fade-in ${templateData.font}">
        <!-- Dynamic Content injected via JS for portability -->
        <header class="text-center mb-20 space-y-6">
            <div class="w-32 h-32 rounded-full overflow-hidden mx-auto border border-white/10 shadow-2xl">
                <img src="${pfpFile ? `assets/${pfpFile.name}` : ''}" alt="${name}" class="w-full h-full object-cover">
            </div>
            <div>
                <h1 class="text-5xl font-black uppercase tracking-tighter mb-2">${name}</h1>
                <p class="text-xs font-mono uppercase tracking-[0.4em] opacity-40">${subtitle}</p>
            </div>
        </header>

        <main class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section class="space-y-8">
                <div class="space-y-4">
                    <h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Biography</h2>
                    <p class="text-sm leading-relaxed opacity-60 italic">${bio}</p>
                </div>
                
                <div class="space-y-4">
                    <h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Highlights</h2>
                    <ul class="space-y-2">
                        ${highlights.filter(h => h.trim()).map(h => `<li class="text-xs opacity-50 flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-current opacity-30"></span>${h}</li>`).join('')}
                    </ul>
                </div>
            </section>

            <section class="space-y-8">
                <div class="space-y-4">
                    <h2 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Provenance</h2>
                    <div id="artworks" class="grid grid-cols-2 gap-4">
                        <!-- Artworks will be rendered here -->
                    </div>
                </div>
            </section>
        </main>

        <footer class="mt-40 pt-10 border-t border-white/5 flex flex-col items-center gap-6">
            <div class="flex gap-4">
                ${socials.filter(s => s.url.trim()).map(s => `<a href="${s.url}" class="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 opacity-40 transition-opacity">${s.type}</a>`).join('')}
            </div>
            <p class="text-[8px] font-mono uppercase tracking-widest opacity-20">Built via Build.Catalogue</p>
        </footer>
    </div>

    <style>
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        body { margin: 0; transition: background 0.5s ease; }
        ${selectedTemplate === 'glass' ? 'body { background-attachment: fixed; }' : ''}
    </style>

    <script>
        const resolveArtworkUrl = (input) => {
            if (!input) return { url: "", isLive: false };
            
            // Ordinals Inscription ID
            if (/^[a-fA-F0-9]{64}i[0-9]+$/.test(input)) {
                return { url: \`https://ordinals.com/content/\${input}\`, isLive: true };
            }

            // IPFS
            if (input.startsWith('ipfs://')) {
                const hash = input.replace('ipfs://', '');
                return { url: \`https://ipfs.io/ipfs/\${hash}\`, isLive: false };
            }

            // Art Blocks
            const artBlocksMatch = input.match(/artblocks\\.io\\/token\\/(?:\\d+\\/)?(0x[a-fA-F0-9]+)\\/(\\d+)/);
            if (artBlocksMatch) {
                return { url: \`https://generator.artblocks.io/\${artBlocksMatch[1]}/\${artBlocksMatch[2]}\`, isLive: true };
            }

            // Default
            const isLive = /\\.(html|php|js)$/i.test(input) || !/\\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)$/i.test(input);
            return { url: input, isLive };
        };

        // Inject artwork data
        fetch('universe.json')
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('artworks');
                data.PROVENANCE_DATA.forEach(art => {
                    const div = document.createElement('div');
                    div.className = "aspect-square rounded-xl overflow-hidden relative group bg-neutral-900 border border-white/5";
                    
                    const { url, isLive } = resolveArtworkUrl(art.inscription_id);
                    
                    div.innerHTML = \`
                        \${url ? (
                            isLive ? 
                            \`<iframe src="\${url}" class="w-full h-full border-none" title="\${art.artwork_title}"></iframe>\` :
                            \`<img src="\${url}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="\${art.artwork_title}">\`
                        ) : '<div class="w-full h-full bg-white/5"></div>'}
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <span class="text-[10px] font-black uppercase leading-tight">\${art.artwork_title}</span>
                            <span class="text-[8px] font-mono opacity-60 uppercase mt-1">\${art.year}</span>
                        </div>
                    \`;
                    container.appendChild(div);
                });
            })
            .catch(err => console.error("Could not load universe package:", err));
    </script>
</body>
</html>`;

        // Add files to zip
        zip.file("index.html", htmlContent);
        zip.file("universe.json", json);

        // Add Profile Picture if exists
        if (pfpFile) {
            zip.file(`assets/${pfpFile.name}`, pfpFile);
        }

        // Generate Zip
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_website_dist.zip`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const isComingSoon = true;

    if (isComingSoon) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start pt-32 md:pt-40 p-6 selection:bg-purple-500/30 overflow-hidden relative">
                <Helmet>
                    <title>Build | CATALOGUE</title>
                </Helmet>

                {/* Exit Button */}
                <Link
                    to="/info"
                    className="hidden md:flex fixed top-8 right-8 z-50 p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 group"
                    title="Exit"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform group-hover:rotate-90 duration-500"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </Link>

                {/* Background Ambience */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black pointer-events-none" />
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 text-center space-y-8 animate-fade-in-up">
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
                            Build Your <br /> Universe
                        </h1>
                        <p className="text-xs md:text-sm font-mono uppercase tracking-[0.5em] text-white/30">
                            The Builder is currently under construction.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="px-8 py-3 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Coming Soon</span>
                        </div>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
                    <span className="text-[120px] font-black uppercase tracking-tighter leading-none select-none">BUILD</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <Helmet>
                <title>Build | CATALOGUE</title>
            </Helmet>

            <div className="max-w-7xl mx-auto pt-32 px-6 pb-40 animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/10">Build Your Own Universe</h1>
                    <div className="flex items-center justify-center gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-white' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-8 xl:gap-16 items-start">

                    {/* Left Side: Form */}
                    <div className="space-y-8 bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-[32px] backdrop-blur-md shadow-2xl">

                        {step === 1 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Select Aesthetic</h2>
                                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Step 1 of 4</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {['minimal', 'studio', 'vanta', 'glass'].map(t => (
                                        <button key={t} onClick={() => setSelectedTemplate(t)} className={`p-6 rounded-2xl border text-left transition-all ${selectedTemplate === t ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white hover:border-white/20'}`}>
                                            <h3 className="font-black uppercase tracking-tight">{t}</h3>
                                            <p className={`text-[8px] font-mono uppercase tracking-widest mt-1 ${selectedTemplate === t ? 'text-black/40' : 'text-white/20'}`}>Aesthetic Layout</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Identity</h2>
                                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Step 2 of 4</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Artist Name</label>
                                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-white/30 outline-none transition-all placeholder-white/10" placeholder="e.g. XCOPY" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Role / Subtitle</label>
                                        <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-white/30 outline-none transition-all placeholder-white/10" placeholder="e.g. Digital Artist" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Profile Image Upload</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full bg-neutral-900 border border-dashed border-white/10 rounded-xl px-4 py-8 text-center transition-all group-hover:border-white/30 group-hover:bg-white/[0.02]">
                                                {pfpFile ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20">
                                                            <img src={pfp} className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-xs text-white/60 font-mono truncate max-w-[200px]">{pfpFile.name}</span>
                                                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest ml-2">✓ Uploaded</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-white/40 block">Drop image or click to upload</span>
                                                        <span className="text-[8px] text-white/20 font-mono uppercase tracking-widest">JPG, PNG, WebP (Max 5MB)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Biography</label>
                                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-white/30 outline-none transition-all placeholder-white/10 resize-none" placeholder="Your story..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Curation</h2>
                                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Step 3 of 4</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Highlights</label>
                                        {highlights.map((h, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input value={h} onChange={e => {
                                                    const newH = [...highlights];
                                                    newH[i] = e.target.value;
                                                    setHighlights(newH);
                                                }} className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all" />
                                                <button onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-white transition-colors">✕</button>
                                            </div>
                                        ))}
                                        <button onClick={() => setHighlights([...highlights, ''])} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors">+ ADD HIGHLIGHT</button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Press Links</label>
                                        {press.map((p, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input value={p.title} onChange={e => {
                                                    const newP = [...press];
                                                    newP[i] = { ...newP[i], title: e.target.value };
                                                    setPress(newP);
                                                }} className="w-1/3 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all" placeholder="Source" />
                                                <input value={p.url} onChange={e => {
                                                    const newP = [...press];
                                                    newP[i] = { ...newP[i], url: e.target.value };
                                                    setPress(newP);
                                                }} className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all" placeholder="URL" />
                                                <button onClick={() => setPress(press.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-white transition-colors">✕</button>
                                            </div>
                                        ))}
                                        <button onClick={() => setPress([...press, { title: '', url: '' }])} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors">+ ADD PRESS LINK</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Universe Logic</h2>
                                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Step 4 of 4</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Body of Work (JSON Array)</label>
                                        <button onClick={() => setJsonInput(`[\n  {\n    "artwork_title": "Genesis",\n    "year": "2024",\n    "inscription_id": "8a44fac50ee67942819179d6e8564a8eb39dc40db4c00785c255c3ae4c0f03e1i0",\n    "collection_name": "First Principles"\n  }\n]`)} className="text-[8px] font-mono text-green-500 hover:underline">INSERT TEMPLATE</button>
                                    </div>
                                    <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} rows={8} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-white/70 focus:border-white/30 outline-none transition-all resize-none" placeholder="Paste your Provenance JSON here..." />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Social Networks</label>
                                    <div className="space-y-2">
                                        {socials.map((s, i) => (
                                            <div key={i} className="flex gap-2">
                                                <select value={s.type} onChange={e => {
                                                    const newS = [...socials];
                                                    newS[i] = { ...newS[i], type: e.target.value };
                                                    setSocials(newS);
                                                }} className="bg-neutral-900 border border-white/10 rounded-xl px-3 text-[10px] text-white/70 font-bold uppercase outline-none">
                                                    <option value="twitter text-black">X / Twitter</option>
                                                    <option value="discord text-black">Discord</option>
                                                    <option value="instagram text-black">Instagram</option>
                                                </select>
                                                <input value={s.url} onChange={e => {
                                                    const newS = [...socials];
                                                    newS[i] = { ...newS[i], url: e.target.value };
                                                    setSocials(newS);
                                                }} className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all" placeholder="Link URL" />
                                                <button onClick={() => setSocials(socials.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-white transition-colors">✕</button>
                                            </div>
                                        ))}
                                        <button onClick={() => setSocials([...socials, { type: 'twitter', url: '' }])} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors">+ ADD LINK</button>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button onClick={handleDownload} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-all shadow-xl shadow-purple-500/10 active:scale-95 cursor-pointer">Download Universe Package</button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            {step > 1 && <button onClick={prevStep} className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer">Back</button>}
                            {step < 4 && <button onClick={nextStep} className="flex-[2] px-6 py-4 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl shadow-purple-500/5 cursor-pointer">Next Step</button>}
                        </div>
                    </div>

                    {/* Right Side: High-Fidelity Preview */}
                    <div className="hidden lg:flex flex-col h-[800px] sticky top-32 bg-neutral-900/50 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">

                        {/* Preview Controls */}
                        <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between shrink-0">
                            <div className="flex gap-4 items-center">
                                <div className="flex gap-1.5 px-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                </div>
                                <div className="h-4 w-px bg-white/10 mx-2" />
                                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                    <button
                                        onClick={() => setPreviewMode('desktop')}
                                        className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded transition-all ${previewMode === 'desktop' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Desktop
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('mobile')}
                                        className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded transition-all ${previewMode === 'mobile' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Mobile
                                    </button>
                                </div>
                            </div>
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mr-4">Live Universe</span>
                        </div>

                        {/* Rendering Container */}
                        <div ref={previewContainerRef} className="flex-1 overflow-hidden flex flex-col items-center justify-center p-8 lg:p-12 bg-[#050505] relative">

                            <div className={`relative transition-all duration-700 flex flex-col items-center ${previewMode === 'mobile' ? 'w-[320px] h-[580px]' : 'w-full'}`}>

                                {/* Device Frame Shell */}
                                <div
                                    className={`relative z-10 transition-all duration-700 shadow-2xl bg-black border-[12px] border-neutral-800 overflow-hidden ${previewMode === 'mobile'
                                        ? 'w-full h-full rounded-[3rem]'
                                        : 'w-full aspect-[16/10] rounded-[2rem]'
                                        }`}
                                >
                                    {/* Notch / Camera */}
                                    <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-center z-50">
                                        <div className="w-12 h-1 rounded-full bg-white/5" />
                                    </div>

                                    {/* Content Screen */}
                                    <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
                                        <div
                                            className={`transition-all duration-700 flex flex-col ${templates[selectedTemplate as keyof typeof templates].bg} ${templates[selectedTemplate as keyof typeof templates].text}`}
                                            style={previewMode === 'desktop' ? {
                                                width: '1280px',
                                                height: '800px',
                                                transform: `scale(${previewScale})`,
                                                transformOrigin: 'top left',
                                                position: 'absolute',
                                                top: '0',
                                                left: '0'
                                            } : {
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        >
                                            <div className={`flex-1 overflow-y-auto scrollbar-hide p-12 space-y-12 ${templates[selectedTemplate as keyof typeof templates].font}`}>
                                                <div className="flex flex-col items-center text-center space-y-6">
                                                    <div className={`w-32 h-32 rounded-full overflow-hidden border border-white/10 shadow-lg ${templates[selectedTemplate as keyof typeof templates].accent === 'bg-white/10 backdrop-blur-md' ? 'backdrop-blur-xl' : ''}`}>
                                                        {pfp && <img src={pfp} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">{name || 'Your Name'}</h3>
                                                        <p className="text-base font-mono uppercase tracking-[0.4em] opacity-40 mt-3">{subtitle || 'Universe Status'}</p>
                                                    </div>
                                                </div>

                                                <div className="max-w-4xl mx-auto space-y-6">
                                                    <div className={`h-px opacity-10 ${templates[selectedTemplate as keyof typeof templates].text === 'text-black' ? 'bg-black' : 'bg-white'}`} />
                                                    <p className="text-xl leading-relaxed opacity-60 italic text-center px-20">{bio || 'Your universe description will render here...'}</p>
                                                </div>

                                                <div className="max-w-5xl mx-auto grid grid-cols-2 gap-8">
                                                    <div className={`aspect-video rounded-[32px] p-8 flex flex-col justify-end ${templates[selectedTemplate as keyof typeof templates].accent}`}>
                                                        <div className="h-2 w-16 bg-current opacity-20 rounded-full" />
                                                    </div>
                                                    <div className={`aspect-video rounded-[32px] p-8 flex flex-col justify-end ${templates[selectedTemplate as keyof typeof templates].accent}`}>
                                                        <div className="h-2 w-16 bg-current opacity-20 rounded-full" />
                                                    </div>
                                                </div>

                                                <div className="max-w-5xl mx-auto space-y-8 pt-8">
                                                    <h4 className="text-xs font-black uppercase tracking-[0.4em] opacity-20 text-center">Body of Work</h4>
                                                    <div className="grid grid-cols-3 gap-6 pb-20">
                                                        {(() => {
                                                            try {
                                                                const artworks = jsonInput ? JSON.parse(jsonInput) : [];
                                                                if (Array.isArray(artworks) && artworks.length > 0) {
                                                                    type PreviewArtwork = { inscription_id?: string; artwork_title?: string; year?: string }
                                                return (artworks as PreviewArtwork[]).slice(0, 9).map((art, i) => {
                                                                        const { url, isLive } = resolveArtworkUrl(art.inscription_id ?? '');
                                                                        return (
                                                                            <div key={i} className={`aspect-square rounded-2xl overflow-hidden relative group ${templates[selectedTemplate as keyof typeof templates].accent}`}>
                                                                                {url ? (
                                                                                    isLive ? (
                                                                                        <div className="w-full h-full relative pointer-events-none">
                                                                                            <iframe
                                                                                                src={url}
                                                                                                className="w-[100%] h-[100%] absolute inset-0 border-none scale-[1.01]"
                                                                                                title={art.artwork_title}
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <img
                                                                                            src={url}
                                                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                                            alt={art.artwork_title}
                                                                                        />
                                                                                    )
                                                                                ) : (
                                                                                    <div className="w-full h-full opacity-50 bg-current" />
                                                                                )}
                                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                                                                    <span className="text-[10px] font-black uppercase leading-tight text-white">{art.artwork_title}</span>
                                                                                    <span className="text-[8px] font-mono opacity-60 uppercase mt-1 text-white">{art.year}</span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    });
                                                                }
                                                            } catch {
                                                                // Ignore malformed preview JSON and render placeholders.
                                                            }
                                                            return [1, 2, 3, 4, 5, 6].map(i => (
                                                                <div key={i} className={`aspect-square rounded-2xl ${templates[selectedTemplate as keyof typeof templates].accent} opacity-50`} />
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-current opacity-5 shrink-0" />
                                        </div>
                                    </div>
                                </div>

                                {/* Laptop Base */}
                                {previewMode === 'desktop' && (
                                    <div className="w-[105%] h-5 bg-neutral-800 rounded-b-3xl border-t border-white/5 shadow-2xl z-0 -mt-2 relative">
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-neutral-900 rounded-full" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
