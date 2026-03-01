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
    source_artist_id: string | null;
    source_artist_name: string | null;
    status: DraftStatus;
    deploy_target: DeployTarget | null;
    revision_note: string | null;
    generated_at: string;
    published_at: string | null;
}

interface Artist {
    _id: string;
    name: string;
    subtitle: string;
    _type: string;
    thumbnailRef?: string;
}

interface GenerationFailure {
    type: DraftType;
    reason: string;
    detail: string;
    snippet: string;
}

interface GenerationResult {
    ok: boolean;
    created: number;
    attempted: number;
    failures?: GenerationFailure[];
}

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';

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

// Converts a Sanity image asset _ref to a CDN URL
function sanityImageUrl(ref: string, size = 200): string {
    // ref format: "image-{hash}-{w}x{h}-{ext}"
    const stripped = ref.replace(/^image-/, '');
    const lastDash = stripped.lastIndexOf('-');
    const ext = stripped.slice(lastDash + 1);
    const body = stripped.slice(0, lastDash);
    return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${body}.${ext}?w=${size}&h=${size}&fit=crop`;
}

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

function humanizeFailureReason(reason: string): string {
    const map: Record<string, string> = {
        timeout: 'timed out',
        http_error: 'API error',
        request_error: 'request failed',
        empty_response: 'empty response',
        no_json_object: 'no JSON found',
        json_parse_failed: 'invalid JSON',
        invalid_shape: 'wrong JSON shape',
    };
    return map[reason] || reason.replace(/_/g, ' ');
}

function formatFailureSummary(failures: GenerationFailure[]): string {
    return failures
        .map((f) => `${f.type}: ${humanizeFailureReason(f.reason)}`)
        .join(' | ');
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
function DraftCard({
    draft,
    password,
    onUpdate,
    artistThumbnailRef,
}: {
    draft: Draft;
    password: string;
    onUpdate: () => void;
    artistThumbnailRef?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showPublish, setShowPublish] = useState(false);
    const [showRevise, setShowRevise] = useState(false);
    const [deployTarget, setDeployTarget] = useState<DeployTarget>('catalogue_article');
    const [revisionNote, setRevisionNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const effectiveThumbnailRef = uploadedAssetId || artistThumbnailRef;

    const apiFetch = useCallback((path: string, body: object) =>
        fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-content-lab-password': password },
            body: JSON.stringify(body),
        }), [password]);

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        setUploadError('');
        try {
            const res = await fetch('/api/content-upload-image', {
                method: 'POST',
                headers: {
                    'x-content-lab-password': password,
                    'content-type': file.type || 'image/jpeg',
                },
                body: await file.arrayBuffer(),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({})) as { error?: string };
                setUploadError(err.error || 'Upload failed');
                return;
            }
            const data = await res.json() as { assetId: string };
            setUploadedAssetId(data.assetId);
        } catch {
            setUploadError('Upload failed — check connection.');
        } finally {
            setUploading(false);
        }
    };

    const handlePublish = async () => {
        setLoading(true);
        const res = await apiFetch('/api/content-publish', {
            id: draft.id,
            title: draft.title,
            excerpt: draft.excerpt,
            content: draft.content,
            tags: draft.tags,
            deploy_target: deployTarget,
            source_artist_id: draft.source_artist_id ?? undefined,
            thumbnailAssetId: effectiveThumbnailRef ?? undefined,
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string };
            alert(body.error || 'Publish failed — check Cloudflare logs.');
        }
        setLoading(false);
        setShowPublish(false);
        onUpdate();
    };

    const handleDelete = async () => {
        setLoading(true);
        await fetch(`/api/content-drafts?id=${encodeURIComponent(draft.id)}`, {
            method: 'DELETE',
            headers: { 'x-content-lab-password': password },
        });
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

                {/* Left col: thumbnail or type badge */}
                {effectiveThumbnailRef ? (
                    <img
                        src={sanityImageUrl(effectiveThumbnailRef, 48)}
                        alt=""
                        className="w-10 h-10 object-cover shrink-0 mt-0.5 opacity-70"
                    />
                ) : (
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest shrink-0 mt-0.5 w-10 pt-0.5">
                        {TYPE_LABEL[draft.type]}
                    </span>
                )}

                {/* Main */}
                <div className="flex-1 min-w-0">
                    {effectiveThumbnailRef && (
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                            {TYPE_LABEL[draft.type]}
                        </span>
                    )}
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

                            {/* Thumbnail */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Thumbnail</p>
                                <div className="flex items-center gap-3">
                                    {effectiveThumbnailRef ? (
                                        <img
                                            src={sanityImageUrl(effectiveThumbnailRef, 80)}
                                            alt="thumbnail preview"
                                            className="w-16 h-16 object-cover border border-white/15 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 border border-white/10 flex items-center justify-center shrink-0">
                                            <span className="text-[9px] font-mono text-white/20">none</span>
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1">
                                        <label className="cursor-pointer block">
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] border px-3 py-1.5 block text-center transition-colors ${uploading ? 'border-white/10 text-white/20' : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/70'}`}>
                                                {uploading ? 'Uploading…' : effectiveThumbnailRef ? 'Replace image' : 'Upload image'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploading}
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file);
                                                }}
                                            />
                                        </label>
                                        {artistThumbnailRef && uploadedAssetId && (
                                            <button
                                                onClick={() => setUploadedAssetId(null)}
                                                className="text-[9px] font-mono text-white/20 hover:text-white/50 transition-colors"
                                            >
                                                ← use artist thumbnail
                                            </button>
                                        )}
                                        {!artistThumbnailRef && !uploadedAssetId && (
                                            <p className="text-[9px] font-mono text-white/20">
                                                No thumbnail — you can add one in Studio after publishing.
                                            </p>
                                        )}
                                        {uploadError && (
                                            <p className="text-[9px] text-red-400/70">{uploadError}</p>
                                        )}
                                    </div>
                                </div>
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
                        onClick={handleDelete}
                        disabled={loading}
                        className="text-white/20 hover:text-red-400/70 transition-colors text-sm font-mono"
                        title="Delete draft permanently"
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
    const [statusFilter, setStatusFilter] = useState<'pending' | 'published'>('pending');
    const [error, setError] = useState('');
    const [artists, setArtists] = useState<Artist[]>([]);
    const [selectedArtistId, setSelectedArtistId] = useState('random');
    const [selectedType, setSelectedType] = useState<DraftType>('article');

    // Fetch artists directly from Sanity public CDN — no auth needed, no Pages Function
    const fetchArtists = useCallback(async () => {
        try {
            const query = encodeURIComponent(
                `*[_type in ["artist","gallery"] && status == "published"]{_id, name, "subtitle": coalesce(subtitle, ""), _type, "thumbnailRef": thumbnail.asset._ref} | order(name asc)`
            );
            const url = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json() as { result: Artist[] };
            setArtists(data.result || []);
        } catch {
            // non-fatal — picker just won't show artists
        }
    }, []);

    // Artists are public — load them immediately on mount, no auth required
    useEffect(() => { fetchArtists(); }, [fetchArtists]);

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

    const handleGenerate = async () => {
        if (generating) return;
        setGenerating(true);
        setError('');
        try {
            const selectedArtist = artists.find(a => a._id === selectedArtistId);
            const body = {
                type: selectedType,
                ...(selectedArtist && selectedType !== 'wildcard'
                    ? { artistId: selectedArtist._id, artistName: selectedArtist.name, artistSubtitle: selectedArtist.subtitle }
                    : {}),
            };
            const res = await fetch('/api/content-generate', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-content-lab-password': password },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({})) as { error?: string };
                setError(data.error === 'API key not configured'
                    ? 'CLAUDE_API_KEY not set — add it via Cloudflare Pages → Settings → Secrets.'
                    : 'Generation failed. Check Cloudflare logs for details.');
                return;
            }
            const result = await res.json() as GenerationResult;
            const failures = result.failures || [];
            if (result.created === 0) {
                const summary = failures.length ? ` Failures: ${formatFailureSummary(failures)}.` : '';
                setError(`Generation created 0/${result.attempted || 3} drafts.${summary}`);
                return;
            }
            await fetchDrafts(password);
            if (failures.length > 0) {
                setError(`Generated ${result.created}/${result.attempted || 3}. Remaining: ${formatFailureSummary(failures)}.`);
            }
        } catch {
            setError('Request failed. Check your connection.');
        } finally {
            setGenerating(false);
        }
    };

    if (!authed) return <AuthGate onAuth={handleAuth} />;

    const groups = groupByDay(drafts.filter(d => d.status === 'pending'));

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
                    <div className="flex flex-col items-end gap-2">
                        {/* Type selector */}
                        <div className="flex items-center gap-1">
                            {(['article', 'blog', 'wildcard'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedType(t)}
                                    disabled={generating}
                                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-colors disabled:opacity-30 ${
                                        selectedType === t
                                            ? 'border-white/50 text-white'
                                            : 'border-white/10 text-white/25 hover:border-white/25 hover:text-white/50'
                                    }`}
                                >
                                    {t === 'wildcard' ? 'Wild' : t}
                                </button>
                            ))}
                        </div>
                        {/* Artist + generate */}
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedArtistId}
                                onChange={e => setSelectedArtistId(e.target.value)}
                                disabled={generating || selectedType === 'wildcard'}
                                className="bg-black border border-white/15 text-[10px] font-mono text-white/50 px-3 py-2.5 focus:border-white/30 outline-none appearance-none cursor-pointer hover:border-white/25 hover:text-white/70 transition-colors disabled:opacity-20 max-w-[180px] truncate"
                            >
                                <option value="random">Random artist</option>
                                {artists.map(a => (
                                    <option key={a._id} value={a._id}>{a.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 hover:border-white/40 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-wait"
                            >
                                {generating ? (
                                    <>
                                        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                        Writing…
                                    </>
                                ) : '+ Generate'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters — pending and published only, deleted = gone */}
                <div className="flex gap-6 mb-10">
                    {(['pending', 'published'] as const).map(s => (
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
                            {statusFilter === 'pending'
                                ? "No pending drafts — hit Generate Now to create today's batch."
                                : `No ${statusFilter} drafts.`}
                        </p>
                    </div>
                ) : statusFilter === 'pending' ? (
                    groups.map(([day, dayDrafts]) => (
                        <div key={day} className="mb-10">
                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em] mb-4">
                                {formatDate(day)}
                            </p>
                            {dayDrafts.map(draft => {
                                const artist = artists.find(a => a._id === draft.source_artist_id);
                                return (
                                    <DraftCard
                                        key={draft.id}
                                        draft={draft}
                                        password={password}
                                        artistThumbnailRef={artist?.thumbnailRef}
                                        onUpdate={() => fetchDrafts(password)}
                                    />
                                );
                            })}
                        </div>
                    ))
                ) : (
                    drafts.map(draft => {
                        const artist = artists.find(a => a._id === draft.source_artist_id);
                        return (
                            <DraftCard
                                key={draft.id}
                                draft={draft}
                                password={password}
                                artistThumbnailRef={artist?.thumbnailRef}
                                onUpdate={() => fetchDrafts(password)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
