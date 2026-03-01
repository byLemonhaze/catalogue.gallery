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
        if (!isOpen) {
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
            className="fixed inset-0 z-[10002] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-5xl h-[85vh] bg-[#0a0a0a] border border-white/10 flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="px-8 py-5 border-b border-white/8 flex flex-col md:flex-row items-center gap-5 bg-black/40">
                    <div className="shrink-0 mr-auto md:mr-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Iframe Tester</p>
                    </div>

                    <div className="flex-1 flex gap-4 w-full items-center border-b border-white/15 focus-within:border-white/40 transition-colors">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent py-2.5 text-xs font-mono text-white outline-none placeholder-white/20"
                            placeholder="https://your-website.com"
                            autoFocus
                        />
                        <button
                            onClick={runTest}
                            className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                        >
                            Test
                        </button>
                    </div>

                    {/* Status */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 transition-colors ${
                            status === 'ready' ? 'bg-white/20' :
                            status === 'loading' ? 'bg-white animate-pulse' :
                            status === 'success' ? 'bg-white' : 'bg-white/40'
                        }`} />
                        <span className={`text-[10px] uppercase font-mono tracking-wider ${
                            status === 'ready' ? 'text-white/30' : 'text-white/70'
                        }`}>
                            {status === 'ready' ? 'Ready' :
                             status === 'loading' ? 'Loading' :
                             status === 'success' ? 'Check preview' : 'Error'}
                        </span>
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="p-2 text-white/30 hover:text-white transition-colors duration-300 cursor-pointer"
                        title="Close"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Info Bar */}
                <div className="border-b border-white/5 px-8 py-2.5 text-[10px] font-mono text-white/30 flex flex-col sm:flex-row justify-between gap-2">
                    <p>
                        <span className="text-white/50">Info:</span> If you see your website below, it loads in iframe. If blank, it's blocked by X-Frame-Options.
                    </p>
                    <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options" target="_blank" rel="noopener noreferrer" className="hover:text-white underline decoration-dotted transition-colors">
                        Why blocked?
                    </a>
                </div>

                {/* Preview */}
                <div className="flex-1 relative bg-[#050505]">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <p className="text-white/8 font-mono tracking-widest text-xs uppercase">Preview</p>
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
