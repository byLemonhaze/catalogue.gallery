import { useState, useRef, useEffect } from 'react';

interface IframeTesterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function IframeTester({ isOpen, onClose }: IframeTesterProps) {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');
    const [iframeSrc, setIframeSrc] = useState('about:blank');

    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            // Optional: autofocus or reset
        } else {
            setIframeSrc('about:blank');
            setStatus('ready');
            setUrl('');
        }
    }, [isOpen]);

    const runTest = () => {
        if (!url.trim()) return;

        let testUrl = url.trim();
        if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
            testUrl = 'https://' + testUrl;
            setUrl(testUrl);
        }

        setStatus('loading');
        setIframeSrc('about:blank');

        setTimeout(() => {
            setIframeSrc(testUrl);
            setStatus('success');
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') runTest();
        if (e.key === 'Escape') onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[10002] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-5xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">

                {/* Header with integrated Close button to prevent overlap */}
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center gap-6 bg-black/40 min-h-[6rem]">
                    <div className="shrink-0 flex flex-col mr-auto md:mr-0">
                        <h3 className="text-xl font-bold tracking-tighter text-white">IFRAME TESTER</h3>
                        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mt-0.5">Utility</p>
                    </div>

                    <div className="flex-1 flex gap-3 w-full">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white focus:border-white/30 outline-none transition-colors placeholder-white/20"
                            placeholder="Enter URL (e.g. https://www.yourart.com)"
                            autoFocus
                        />
                        <button
                            onClick={runTest}
                            className="bg-white text-black px-6 py-2 rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors tracking-widest"
                        >
                            TEST
                        </button>
                    </div>

                    {/* Status Indicator */}
                    <div className={`shrink-0 px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${status === 'ready' ? 'bg-white/5 border-white/5' :
                        status === 'loading' ? 'bg-white/5 border-white/20' :
                            status === 'success' ? 'bg-white/10 border-white/20' :
                                'bg-white/5 border-white/20'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${status === 'ready' ? 'bg-white/20' :
                            status === 'loading' ? 'bg-white animate-pulse' :
                                status === 'success' ? 'bg-white' :
                                    'bg-white/50'
                            }`}></span>
                        <span className={`text-[10px] uppercase font-mono tracking-wider ${status === 'ready' ? 'text-white/30' : 'text-white'}`}>
                            {status === 'ready' ? 'READY' :
                                status === 'loading' ? 'LOADING...' :
                                    status === 'success' ? 'CHECK PREVIEW' :
                                        'ERROR'}
                        </span>
                    </div>

                    {/* Integrated Close Button */}
                    <button onClick={onClose} className="text-white/30 hover:text-white px-4 py-2 transition-colors">✕ Close</button>
                </div>

                {/* Status Message / Tips */}
                <div className="bg-neutral-900/50 border-b border-white/5 px-8 py-3 text-[10px] font-mono text-white/40 flex flex-col sm:flex-row justify-between gap-2">
                    <p>
                        <span className="text-white/70">INFO:</span> If you see your website below, it works. If blank/refused, it is blocked by x-frame-options.
                    </p>
                    <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options" target="_blank" rel="noopener noreferrer" className="hover:text-white underline decoration-dotted transition-colors">Why blocked?</a>
                </div>

                {/* Preview */}
                <div className="flex-1 relative bg-[#050505]">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <p className="text-white/10 font-mono tracking-widest text-xs uppercase">Preview Area</p>
                    </div>
                    <iframe
                        ref={iframeRef}
                        src={iframeSrc}
                        className="w-full h-full relative z-10 bg-transparent"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        onError={() => setStatus('error')}
                    />
                </div>
            </div>
        </div>
    );
}
