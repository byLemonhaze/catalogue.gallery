import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SquareLoader } from '../components/SquareLoader';
import { generateDraftWithByok, type ContentLabArtistSeed, type ContentLabDraftType } from '../lib/contentLab/byok';

type DraftType = ContentLabDraftType;
type DraftStatus = 'pending' | 'published' | 'dismissed';
type DeployTarget = 'catalogue_article' | 'catalogue_blog' | 'catalogue_interview' | 'personal_blog';
type GenerationMode = 'server' | 'byok';

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
    websiteUrl?: string;
    contentBio?: string;
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

interface DraftCreateResponse {
    ok: boolean;
    draft?: Draft;
    error?: string;
}

const SANITY_PROJECT_ID = 'ebj9kqfo';
const SANITY_DATASET = 'production';
const BYOK_SESSION_KEY = 'content-lab:xai-api-key';

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
        .map((f) => {
            const reason = humanizeFailureReason(f.reason);
            return f.detail ? `${f.type}: ${reason} — ${f.detail}` : `${f.type}: ${reason}`;
        })
        .join(' | ');
}

function toArtistSeed(artist: Artist): ContentLabArtistSeed {
    return {
        _id: artist._id,
        name: artist.name,
        subtitle: artist.subtitle,
        contentBio: artist.contentBio,
    };
}

function pickRandomArtistSeed(artists: Artist[]): ContentLabArtistSeed | null {
    if (artists.length === 0) return null;
    const artist = artists[Math.floor(Math.random() * artists.length)];
    return toArtistSeed(artist);
}

// ─── Auth gate ───────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (pw: string) => void }) {
    const [pw, setPw] = useState('');
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-black px-6 text-white">
            <div className="w-full max-w-sm border border-white/10 bg-white/[0.02] p-6 md:p-7">
                <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Content Lab</p>
                <p className="text-sm leading-relaxed text-white/50">
                    The Content Lab is currently in private beta. Public access is coming soon.
                </p>
                <input
                    type="password"
                    autoFocus
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && pw && onAuth(pw)}
                    className="mt-8 mb-4 w-full border-b border-white/15 bg-transparent py-2.5 text-sm text-white outline-none placeholder-white/20 focus:border-white/50"
                    placeholder="Password"
                />
                <button
                    onClick={() => pw && onAuth(pw)}
                    className="w-full border border-white/20 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                    Enter
                </button>
            </div>
        </div>
    );
}

// ─── Draft card ──────────────────────────────────────────────────────────────
function contentLabApiFetch(password: string, path: string, body: object) {
    return fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-content-lab-password': password },
        body: JSON.stringify(body),
    });
}

async function uploadDraftImage(password: string, file: File) {
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
        return { ok: false as const, error: err.error || 'Upload failed' };
    }

    const data = await res.json() as { assetId: string };
    return { ok: true as const, assetId: data.assetId };
}

async function publishDraft(
    password: string,
    draft: Draft,
    deployTarget: DeployTarget,
    thumbnailAssetId?: string
) {
    return contentLabApiFetch(password, '/api/content-publish', {
        id: draft.id,
        title: draft.title,
        excerpt: draft.excerpt,
        content: draft.content,
        tags: draft.tags,
        deploy_target: deployTarget,
        source_artist_id: draft.source_artist_id ?? undefined,
        thumbnailAssetId: thumbnailAssetId ?? undefined,
    });
}

async function deleteDraft(password: string, draftId: string) {
    return fetch(`/api/content-drafts?id=${encodeURIComponent(draftId)}`, {
        method: 'DELETE',
        headers: { 'x-content-lab-password': password },
    });
}

async function saveDraftRevision(password: string, draftId: string, revisionNote: string) {
    return contentLabApiFetch(password, '/api/content-drafts', {
        id: draftId,
        revision_note: revisionNote,
    });
}

async function createContentDraft(password: string, body: {
    type: DraftType;
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    source_artist_id?: string | null;
    source_artist_name?: string | null;
}) {
    return contentLabApiFetch(password, '/api/content-drafts', {
        operation: 'create',
        ...body,
    });
}

function DraftThumbnail({
    type,
    effectiveThumbnailRef,
}: {
    type: DraftType
    effectiveThumbnailRef?: string | null
}) {
    if (effectiveThumbnailRef) {
        return (
            <img
                src={sanityImageUrl(effectiveThumbnailRef, 48)}
                alt=""
                className="w-10 h-10 object-cover shrink-0 mt-0.5 opacity-70"
            />
        )
    }

    return (
        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest shrink-0 mt-0.5 w-10 pt-0.5">
            {TYPE_LABEL[type]}
        </span>
    )
}

function DraftTags({ tags }: { tags?: string[] }) {
    if (!tags?.length) return null

    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
                <span key={tag} className="text-[9px] font-mono text-white/20 border border-white/10 px-1.5 py-0.5 uppercase tracking-wider">
                    {tag}
                </span>
            ))}
        </div>
    )
}

function DraftPublishPanel({
    deployTarget,
    setDeployTarget,
    effectiveThumbnailRef,
    artistThumbnailRef,
    uploadedAssetId,
    setUploadedAssetId,
    uploading,
    uploadError,
    onFileSelect,
    loading,
    onPublish,
}: {
    deployTarget: DeployTarget
    setDeployTarget: (value: DeployTarget) => void
    effectiveThumbnailRef?: string | null
    artistThumbnailRef?: string
    uploadedAssetId: string | null
    setUploadedAssetId: (value: string | null) => void
    uploading: boolean
    uploadError: string
    onFileSelect: (file: File) => void
    loading: boolean
    onPublish: () => void
}) {
    return (
        <div className="mt-3 p-3 border border-white/10 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Publish to</p>
            <div className="grid grid-cols-2 gap-1.5">
                {DEPLOY_OPTIONS.map((opt) => (
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
                            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] border px-3 py-1.5 block text-center transition-colors ${
                                uploading ? 'border-white/10 text-white/20' : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/70'
                            }`}>
                                {uploading ? 'Uploading…' : effectiveThumbnailRef ? 'Replace image' : 'Upload image'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    if (file) onFileSelect(file)
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
                onClick={onPublish}
                disabled={loading}
                className="w-full py-2 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/25 text-white/80 hover:border-white/50 hover:text-white transition-colors disabled:opacity-30"
            >
                {loading ? 'Publishing...' : 'Confirm Publish'}
            </button>
        </div>
    )
}

function DraftRevisePanel({
    revisionNote,
    setRevisionNote,
    loading,
    onRevise,
}: {
    revisionNote: string
    setRevisionNote: (value: string) => void
    loading: boolean
    onRevise: () => void
}) {
    return (
        <div className="mt-3 p-3 border border-white/10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Note for revision</p>
            <textarea
                autoFocus
                value={revisionNote}
                onChange={(event) => setRevisionNote(event.target.value)}
                rows={3}
                className="w-full bg-transparent border border-white/10 p-2 text-[11px] text-white/70 focus:border-white/30 outline-none resize-none placeholder-white/20"
                placeholder="e.g. Make it shorter, sharpen the opening, less biography..."
            />
            <button
                onClick={onRevise}
                disabled={loading || !revisionNote.trim()}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 transition-colors disabled:opacity-30"
            >
                {loading ? 'Saving...' : 'Save Note'}
            </button>
        </div>
    )
}

function DraftActionButtons({
    onTogglePublish,
    onToggleRevise,
    onDelete,
    loading,
}: {
    onTogglePublish: () => void
    onToggleRevise: () => void
    onDelete: () => void
    loading: boolean
}) {
    return (
        <div className="flex items-center gap-3 shrink-0">
            <button
                onClick={onTogglePublish}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
                Publish
            </button>
            <button
                onClick={onToggleRevise}
                className="text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-white/70 transition-colors"
            >
                Revise
            </button>
            <button
                onClick={onDelete}
                disabled={loading}
                className="text-white/20 hover:text-red-400/70 transition-colors text-sm font-mono"
                title="Delete draft permanently"
            >
                ×
            </button>
        </div>
    )
}

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

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        setUploadError('');
        try {
            const result = await uploadDraftImage(password, file);
            if (!result.ok) {
                setUploadError(result.error);
                return;
            }
            setUploadedAssetId(result.assetId);
        } catch {
            setUploadError('Upload failed — check connection.');
        } finally {
            setUploading(false);
        }
    };

    const handlePublish = async () => {
        setLoading(true);
        const res = await publishDraft(password, draft, deployTarget, effectiveThumbnailRef ?? undefined);
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
        await deleteDraft(password, draft.id);
        setLoading(false);
        onUpdate();
    };

    const handleRevise = async () => {
        if (!revisionNote.trim()) return;
        setLoading(true);
        await saveDraftRevision(password, draft.id, revisionNote);
        setLoading(false);
        setShowRevise(false);
        setRevisionNote('');
        onUpdate();
    };

    const togglePublishPanel = () => {
        setShowPublish((current) => !current);
        setShowRevise(false);
    };

    const toggleRevisePanel = () => {
        setShowRevise((current) => !current);
        setShowPublish(false);
    };

    return (
        <div className="border-b border-white/8 py-5">
            <div className="flex items-start gap-4">
                <DraftThumbnail type={draft.type} effectiveThumbnailRef={effectiveThumbnailRef} />
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
                        <DraftTags tags={draft.tags} />
                    </button>

                    {expanded && (
                        <div className="mt-4 p-4 bg-white/3 text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto border border-white/8">
                            {draft.content}
                        </div>
                    )}

                    {showPublish && (
                        <DraftPublishPanel
                            deployTarget={deployTarget}
                            setDeployTarget={setDeployTarget}
                            effectiveThumbnailRef={effectiveThumbnailRef}
                            artistThumbnailRef={artistThumbnailRef}
                            uploadedAssetId={uploadedAssetId}
                            setUploadedAssetId={setUploadedAssetId}
                            uploading={uploading}
                            uploadError={uploadError}
                            onFileSelect={handleImageUpload}
                            loading={loading}
                            onPublish={handlePublish}
                        />
                    )}

                    {showRevise && (
                        <DraftRevisePanel
                            revisionNote={revisionNote}
                            setRevisionNote={setRevisionNote}
                            loading={loading}
                            onRevise={handleRevise}
                        />
                    )}
                </div>

                <DraftActionButtons
                    onTogglePublish={togglePublishPanel}
                    onToggleRevise={toggleRevisePanel}
                    onDelete={handleDelete}
                    loading={loading}
                />
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
    const [byokApiKey, setByokApiKey] = useState(() => {
        if (typeof window === 'undefined') return '';
        return window.sessionStorage.getItem(BYOK_SESSION_KEY) || '';
    });
    const [generationMode, setGenerationMode] = useState<GenerationMode>(() => {
        if (typeof window === 'undefined') return 'server';
        return window.sessionStorage.getItem(BYOK_SESSION_KEY) ? 'byok' : 'server';
    });
    const [scraping, setScraping] = useState(false);
    const [scrapeStatus, setScrapeStatus] = useState<{ ok: boolean; msg: string } | null>(null);

    // Fetch artists directly from Sanity public CDN — no auth needed, no Pages Function
    const fetchArtists = useCallback(async () => {
        try {
            const query = encodeURIComponent(
                `*[_type in ["artist","gallery"] && status == "published"]{_id, name, "subtitle": coalesce(subtitle, ""), _type, "thumbnailRef": thumbnail.asset._ref, websiteUrl, contentBio} | order(name asc)`
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

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const trimmed = byokApiKey.trim();
        if (trimmed) {
            window.sessionStorage.setItem(BYOK_SESSION_KEY, trimmed);
            return;
        }

        window.sessionStorage.removeItem(BYOK_SESSION_KEY);
    }, [byokApiKey]);

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
            if (generationMode === 'server') {
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
                    setError(data.error === 'Grok API key not configured'
                        ? 'GROK_API_KEY is not configured on this deployment.'
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
                return;
            }

            const trimmedKey = byokApiKey.trim();
            if (!trimmedKey) {
                setError('Add your xAI API key to use BYOK generation.');
                return;
            }

            const selectedArtist = artists.find((artist) => artist._id === selectedArtistId);
            const artistSeed = selectedType === 'wildcard'
                ? null
                : selectedArtistId === 'random'
                    ? pickRandomArtistSeed(artists)
                    : (selectedArtist ? toArtistSeed(selectedArtist) : null);

            if (selectedType !== 'wildcard' && !artistSeed) {
                setError('Select an artist or wait for the directory to load.');
                return;
            }

            const generated = await generateDraftWithByok({
                apiKey: trimmedKey,
                type: selectedType,
                artist: artistSeed,
            });

            if (!generated.ok) {
                const reason = humanizeFailureReason(generated.failure.reason);
                const detail = generated.failure.detail ? ` ${generated.failure.detail}` : '';
                setError(`BYOK generation failed: ${reason}.${detail}`.trim());
                return;
            }

            const draftRes = await createContentDraft(password, {
                type: selectedType,
                title: generated.draft.title,
                excerpt: generated.draft.excerpt,
                content: generated.draft.content,
                tags: generated.draft.tags,
                source_artist_id: selectedType === 'wildcard' ? null : (artistSeed?._id || null),
                source_artist_name: selectedType === 'wildcard' ? null : (artistSeed?.name || null),
            });
            const saved = await draftRes.json().catch(() => ({ ok: false, error: 'Draft save failed.' })) as DraftCreateResponse;
            if (!draftRes.ok || !saved.ok) {
                setError(saved.error || 'Draft save failed.');
                return;
            }

            await fetchDrafts(password);
        } catch {
            setError('Request failed. Check your connection.');
        } finally {
            setGenerating(false);
        }
    };

    const handleScrape = async () => {
        if (scraping || selectedArtistId === 'random') return;
        setScraping(true);
        setScrapeStatus(null);
        try {
            const res = await fetch('/api/content-scrape', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-content-lab-password': password },
                body: JSON.stringify({ artistId: selectedArtistId }),
            });
            const data = await res.json() as { ok?: boolean; error?: string; artistName?: string };
            if (!res.ok || !data.ok) {
                setScrapeStatus({ ok: false, msg: data.error || 'Scrape failed.' });
            } else {
                setScrapeStatus({ ok: true, msg: `Research saved for ${data.artistName}` });
                // Refresh artists to pick up new contentBio
                await fetchArtists();
            }
        } catch {
            setScrapeStatus({ ok: false, msg: 'Request failed.' });
        } finally {
            setScraping(false);
        }
    };

    if (!authed) return <AuthGate onAuth={handleAuth} />;

    const groups = groupByDay(drafts.filter(d => d.status === 'pending'));

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet><title>Content Lab | CATALOGUE</title></Helmet>

            <div className="max-w-3xl mx-auto px-6 pt-20 pb-32">

                {/* Header */}
                <div className="mb-12 border-b border-white/8 pb-6">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Content Lab</h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
                                Draft generation, review, and publishing for the writing layer around the catalogue.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link
                                    to="/blog"
                                    className="inline-flex items-center justify-center border border-white/18 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-white/45 hover:bg-white/5"
                                >
                                    Open archive
                                </Link>
                                <Link
                                    to="/info"
                                    className="inline-flex items-center justify-center border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors duration-300 hover:border-white/35 hover:text-white"
                                >
                                    About Catalogue
                                </Link>
                            </div>
                        </div>

                        <div className="w-full max-w-xl space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-[11px] text-white/30">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</p>
                                <div className="flex items-center gap-1">
                                    {([
                                        { value: 'server', label: 'Server key' },
                                        { value: 'byok', label: 'Bring your own key' },
                                    ] as const).map((mode) => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setGenerationMode(mode.value)}
                                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-colors ${
                                                generationMode === mode.value
                                                    ? 'border-white/50 text-white'
                                                    : 'border-white/10 text-white/25 hover:border-white/25 hover:text-white/50'
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {generationMode === 'byok' && (
                                <div className="border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <input
                                            type="password"
                                            autoComplete="off"
                                            spellCheck={false}
                                            value={byokApiKey}
                                            onChange={(event) => setByokApiKey(event.target.value)}
                                            placeholder="Paste xAI API key"
                                            className="min-w-0 flex-1 border border-white/10 bg-black px-3 py-2.5 text-[11px] text-white/75 outline-none transition-colors focus:border-white/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setByokApiKey('')}
                                            className="border border-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 transition-colors hover:border-white/30 hover:text-white/75"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <p className="mt-3 text-[10px] leading-relaxed text-white/35">
                                        Your xAI key stays in this browser session and is sent directly to xAI from your device. CATALOGUE does not store it or send it through <code className="font-mono text-white/55">/api/*</code>.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-1">
                                {(['article', 'blog', 'wildcard'] as const).map((t) => (
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

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative flex items-center">
                                    <select
                                        value={selectedArtistId}
                                        onChange={(event) => { setSelectedArtistId(event.target.value); setScrapeStatus(null); }}
                                        disabled={generating || selectedType === 'wildcard'}
                                        className="max-w-[220px] cursor-pointer appearance-none border border-white/15 bg-black px-3 py-2.5 text-[10px] font-mono text-white/50 outline-none transition-colors hover:border-white/25 hover:text-white/70 focus:border-white/30 disabled:opacity-20"
                                    >
                                        <option value="random">Random artist</option>
                                        {artists.map((artist) => (
                                            <option key={artist._id} value={artist._id}>{artist.name}</option>
                                        ))}
                                    </select>
                                    {selectedArtistId !== 'random' && selectedType !== 'wildcard' && (() => {
                                        const artist = artists.find((entry) => entry._id === selectedArtistId);
                                        return (
                                            <span
                                                className={`absolute -top-1 -right-1 h-2 w-2 ${artist?.contentBio ? 'bg-emerald-500' : 'bg-yellow-500/70'}`}
                                                title={artist?.contentBio ? 'Research cached' : 'No research cached yet'}
                                            />
                                        );
                                    })()}
                                </div>

                                {selectedArtistId !== 'random' && selectedType !== 'wildcard' && (
                                    <button
                                        onClick={handleScrape}
                                        disabled={scraping || generating}
                                        className="flex items-center gap-1.5 border border-white/10 px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/25 transition-colors hover:border-white/25 hover:text-white/60 disabled:opacity-30"
                                        title="Scrape artist website and cache research bio"
                                    >
                                        {scraping ? (
                                            <SquareLoader className="w-2.5 h-2.5 opacity-90" label="Fetching research" strokeWidth={1} />
                                        ) : '↓'}
                                        Research
                                    </button>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="flex items-center gap-2 border border-white/20 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:cursor-wait disabled:opacity-40"
                                >
                                    {generating ? (
                                        <>
                                            <SquareLoader className="w-3 h-3" label="Generating content" strokeWidth={1.1} />
                                            Writing…
                                        </>
                                    ) : 'Generate draft'}
                                </button>
                            </div>

                            {scrapeStatus && (
                                <p className={`text-[9px] font-mono ${scrapeStatus.ok ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                    {scrapeStatus.msg}
                                </p>
                            )}
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
                        <SquareLoader className="w-5 h-5" label="Loading drafts" strokeWidth={1.3} />
                    </div>
                ) : drafts.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-[11px] font-mono text-white/20 uppercase tracking-[0.3em]">
                            {statusFilter === 'pending'
                                ? 'No pending drafts yet.'
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
