import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

type DraftType = 'article' | 'blog' | 'wildcard';
type DraftStatus = 'pending' | 'published' | 'dismissed';
type DeployTarget = 'catalogue_article' | 'catalogue_blog' | 'catalogue_interview' | 'personal_blog';

interface Draft {
    id: string;
    type: DraftType;
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    source_artist_name: string | null;
    status: DraftStatus;
    deploy_target: DeployTarget | null;
    revision_note: string | null;
    generated_at: string;
    published_at: string | null;
}

const TYPE_LABEL: Record<DraftType, string> = {
    article: 'Article',
    blog: 'Blog',
    wildcard: 'Wild',
};

const DEPLOY_OPTIONS: { value: DeployTarget; label: string }[] = [
    { value: 'catalogue_article', label: 'Article → Catalogue' },
    { value: 'catalogue_blog', label: 'Blog → Catalogue' },
    { value: 'catalogue_interview', label: 'Interview → Catalogue' },
    { value: 'personal_blog', label: 'Personal Blog → lemonhaze.com' },
];

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDay(drafts: Draft[]): [string, Draft[]][] {
    const groups: Record<string, Draft[]> = {};
    for (const d of drafts) {
        const day = d.generated_at.slice(0, 10);
        if (!groups[day]) groups[day] = [];
        groups[day].push(d);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

// ─── Auth gate ───────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (pw: string) => void }) {
    const [pw, setPw] = useState('');
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="w-full max-w-xs">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-6">Content Lab</p>
                <input
                    type="password"
                    autoFocus
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && pw && onAuth(pw)}
                    className="w-full bg-transparent border-b border-white/15 py-2.5 text-sm text-white focus:border-white/50 outline-none placeholder-white/20 mb-4"
                    placeholder="Password"
                />
                <button
                    onClick={() => pw && onAuth(pw)}
                    className="w-full py-3 text-[11px] font-bold uppercase tracking-[0.25em] border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition-colors"
                >
                    Enter
                </button>
            </div>
        </div>
    );
}

// ─── Draft card ──────────────────────────────────────────────────────────────
function DraftCard({ draft, password, onUpdate }: { draft: Draft; password: string; onUpdate: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [showPublish, setShowPublish] = useState(false);
    const [showRevise, setShowRevise] = useState(false);
    const [deployTarget, setDeployTarget] = useState<DeployTarget>('catalogue_article');
    const [revisionNote, setRevisionNote] = useState('');
    const [loading, setLoading] = useState(false);

    const apiFetch = useCallback((path: string, body: object) =>
        fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-content-lab-password': password },
            body: JSON.stringify(body),
        }), [password]);

    const handlePublish = async () => {
        setLoading(true);
        await apiFetch('/api/content-publish', {
            id: draft.id, title: draft.title, excerpt: draft.excerpt,
            content: draft.content, tags: draft.tags, deploy_target: deployTarget,
        });
        setLoading(false);
        setShowPublish(false);
        onUpdate();
    };

    const handleDismiss = async () => {
        setLoading(true);
        await apiFetch('/api/content-drafts', { id: draft.id, status: 'dismissed' });
        setLoading(false);
        onUpdate();
    };

    const handleRevise = async () => {
        if (!revisionNote.trim()) return;
        setLoading(true);
        await apiFetch('/api/content-drafts', { id: draft.id, revision_note: revisionNote });
        setLoading(false);
        setShowRevise(false);
        setRevisionNote('');
        onUpdate();
    };

    return (
        <div className="border-b border-white/8 py-5">
            <div className="flex items-start gap-4">
                {/* Type badge */}
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest shrink-0 mt-0.5 w-10">
                    {TYPE_LABEL[draft.type]}
                </span>

                {/* Main */}
                <div className="flex-1 min-w-0">
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="text-left w-full group"
                    >
                        <p className="text-sm font-bold text-white/85 group-hover:text-white transition-colors leading-tight uppercase tracking-tight">
                            {draft.title}
                        </p>
                        {draft.source_artist_name && (
                            <p className="text-[10px] font-mono text-white/25 mt-0.5">
                                {draft.source_artist_name}
                            </p>
                        )}
                        <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
                            {draft.excerpt}
                        </p>
                        {draft.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {draft.tags.map(t => (
                                    <span key={t} className="text-[9px] font-mono text-white/20 border border-white/10 px-1.5 py-0.5 uppercase tracking-wider">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </button>

                    {/* Expanded content preview */}
                    {expanded && (
                        <div className="mt-4 p-4 bg-white/3 text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto border border-white/8">
                            {draft.content}
                        </div>
                    )}

                    {/* Publish panel */}
                    {showPublish && (
                        <div className="mt-3 p-3 border border-white/10 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Publish to</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {DEPLOY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDeployTarget(opt.value)}
                                        className={`py-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] border transition-colors text-left ${
                                            deployTarget === opt.value
                                                ? 'border-white/40 text-white'
                                                : 'border-white/10 text-white/30 hover:border-white/25 hover:text-white/60'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handlePublish}
                                disabled={loading}
                                className="w-full py-2 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/25 text-white/80 hover:border-white/50 hover:text-white transition-colors disabled:opacity-30"
                            >
                                {loading ? 'Publishing...' : 'Confirm Publish'}
                            </button>
                        </div>
                    )}

                    {/* Revise panel */}
                    {showRevise && (
                        <div className="mt-3 p-3 border border-white/10 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Note for revision</p>
                            <textarea
                                autoFocus
                                value={revisionNote}
                                onChange={e => setRevisionNote(e.target.value)}
                                rows={3}
                                className="w-full bg-transparent border border-white/10 p-2 text-[11px] text-white/70 focus:border-white/30 outline-none resize-none placeholder-white/20"
                                placeholder="e.g. Make it shorter, sharpen the opening, less biography..."
                            />
                            <button
                                onClick={handleRevise}
                                disabled={loading || !revisionNote.trim()}
                                className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 transition-colors disabled:opacity-30"
                            >
                                {loading ? 'Saving...' : 'Save Note'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => { setShowPublish(p => !p); setShowRevise(false); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                    >
                        Publish
                    </button>
                    <button
                        onClick={() => { setShowRevise(r => !r); setShowPublish(false); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-white/70 transition-colors"
                    >
                        Revise
                    </button>
                    <button
                        onClick={handleDismiss}
                        disabled={loading}
                        className="text-white/15 hover:text-white/50 transition-colors text-xs"
                        title="Dismiss"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main dashboard ──────────────────────────────────────────────────────────
export function ContentLab() {
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [awaitingGeneration, setAwaitingGeneration] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'published' | 'dismissed'>('pending');
    const [error, setError] = useState('');

    const fetchDrafts = useCallback(async (pw: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/content-drafts?status=${statusFilter}`, {
                headers: { 'x-content-lab-password': pw },
            });
            if (res.status === 401) { setAuthed(false); return; }
            const data = await res.json() as { drafts: Draft[] };
            setDrafts(data.drafts || []);
        } catch {
            setError('Failed to load drafts.');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const handleAuth = useCallback((pw: string) => {
        setPassword(pw);
        setAuthed(true);
        fetchDrafts(pw);
    }, [fetchDrafts]);

    useEffect(() => {
        if (authed && password) fetchDrafts(password);
    }, [authed, password, statusFilter, fetchDrafts]);

    // Countdown tick — auto-refresh when it hits 0
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => {
            setCountdown(c => {
                if (c <= 1) {
                    setAwaitingGeneration(false);
                    fetchDrafts(password);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearTimeout(t);
    }, [countdown, password, fetchDrafts]);

    const handleGenerate = async () => {
        if (generating || awaitingGeneration) return;
        setGenerating(true);
        setError('');
        try {
            const res = await fetch('/api/content-generate', {
                method: 'POST',
                headers: { 'x-content-lab-password': password },
            });
            if (!res.ok) { setError('Generation failed — check API key in Cloudflare secrets.'); return; }
            // Generation queued in background — show countdown and auto-refresh
            setAwaitingGeneration(true);
            setCountdown(70);
        } catch {
            setError('Generation failed.');
        } finally {
            setGenerating(false);
        }
    };

    if (!authed) return <AuthGate onAuth={handleAuth} />;

    const pending = drafts.filter(d => d.status === 'pending');
    const groups = groupByDay(pending);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet><title>Content Lab | CATALOGUE</title></Helmet>

            <div className="max-w-3xl mx-auto px-6 pt-20 pb-32">

                {/* Header */}
                <div className="flex items-end justify-between mb-12 pb-6 border-b border-white/8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-2">Catalogue</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Content Lab</h1>
                        <p className="text-[11px] text-white/30 mt-1">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || awaitingGeneration}
                        className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 hover:border-white/40 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-wait"
                    >
                        {generating ? (
                            <>
                                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                Queuing…
                            </>
                        ) : awaitingGeneration ? (
                            <>
                                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                Generating ({countdown}s)
                            </>
                        ) : '+ Generate Now'}
                    </button>
                </div>

                {/* Background generation banner */}
                {awaitingGeneration && (
                    <div className="mb-8 px-4 py-3 border border-white/15 flex items-center gap-3">
                        <span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                            Claude is writing — auto-refreshing in {countdown}s
                        </p>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-6 mb-10">
                    {(['pending', 'published', 'dismissed'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`text-[10px] font-bold uppercase tracking-[0.2em] pb-2 border-b transition-colors ${
                                statusFilter === s
                                    ? 'border-white text-white'
                                    : 'border-transparent text-white/25 hover:text-white/50'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {error && (
                    <p className="text-xs text-red-400/70 mb-6 border border-red-500/20 px-4 py-3">{error}</p>
                )}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                ) : drafts.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-[11px] font-mono text-white/20 uppercase tracking-[0.3em]">
                            {statusFilter === 'pending' ? 'No pending drafts — hit Generate Now to create today\'s batch.' : `No ${statusFilter} drafts.`}
                        </p>
                    </div>
                ) : statusFilter === 'pending' ? (
                    // Grouped by day
                    groups.map(([day, dayDrafts]) => (
                        <div key={day} className="mb-10">
                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em] mb-4">
                                {formatDate(day)}
                            </p>
                            {dayDrafts.map(draft => (
                                <DraftCard
                                    key={draft.id}
                                    draft={draft}
                                    password={password}
                                    onUpdate={() => fetchDrafts(password)}
                                />
                            ))}
                        </div>
                    ))
                ) : (
                    // Flat list for published/dismissed
                    drafts.map(draft => (
                        <DraftCard
                            key={draft.id}
                            draft={draft}
                            password={password}
                            onUpdate={() => fetchDrafts(password)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
