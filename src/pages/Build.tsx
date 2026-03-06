import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export function Build() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start pt-32 md:pt-40 p-6 selection:bg-purple-500/30 overflow-hidden relative">
            <Helmet>
                <title>Build | CATALOGUE</title>
            </Helmet>

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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </Link>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black pointer-events-none" />
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                }}
            />

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

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
                <span className="text-[120px] font-black uppercase tracking-tighter leading-none select-none">BUILD</span>
            </div>
        </div>
    )
}
