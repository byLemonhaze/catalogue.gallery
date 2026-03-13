import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { IframeTester } from '../components/IframeTester';
import { SquareLoader } from '../components/SquareLoader';


export function SubmitArtist() {
    const [formData, setFormData] = useState({
        name: '',
        subtitle: '',
        websiteUrl: '',
        type: 'artist' as 'artist' | 'gallery' | 'collector'
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isTesterOpen, setIsTesterOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnailFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.type === 'collector') return;

        setIsSubmitting(true);
        setStatus(null);

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('subtitle', formData.subtitle);
            submitData.append('websiteUrl', formData.websiteUrl);
            submitData.append('type', formData.type);
            if (thumbnailFile) {
                submitData.append('thumbnail', thumbnailFile);
            }

            const response = await fetch('/api/submit', {
                method: 'POST',
                body: submitData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Submission failed');
            }

            setStatus({ type: 'success', message: 'Application received. We will be in touch shortly.' });
            setFormData({ name: '', subtitle: '', websiteUrl: '', type: formData.type });
            setThumbnailFile(null);
            setPreviewUrl(null);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Submission failed';
            const isCorsError = message === 'Failed to fetch' || (err instanceof TypeError);
            setStatus({
                type: 'error',
                message: isCorsError ? 'Network error. Please check your connection and try again.' : message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-y-auto overflow-x-hidden">
            <Helmet>
                <title>Apply | CATALOGUE</title>
            </Helmet>

            <IframeTester isOpen={isTesterOpen} onClose={() => setIsTesterOpen(false)} />

            <div className="max-w-5xl mx-auto w-full px-6 lg:px-12 pt-28 md:pt-32 pb-24 animate-fade-in">

                {/* Page Header */}
                <div className="mb-16 md:mb-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Apply</p>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none text-white mb-6">
                        Join the Directory
                    </h1>
                    <p className="text-white/50 text-sm max-w-lg leading-relaxed">
                        CATALOGUE connects collectors directly to artist-owned websites — unfiltered, self-curated, and independent. Each listing is reviewed before publishing.
                    </p>
                </div>

                {/* Type Selector */}
                <div className="flex gap-8 mb-14 border-b border-white/10 pb-0">
                    {(['artist', 'gallery', 'collector'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            disabled={t === 'collector'}
                            onClick={() => t !== 'collector' && setFormData({ ...formData, type: t })}
                            className={`relative pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-200 cursor-pointer disabled:cursor-default
                                ${formData.type === t ? 'text-white' : 'text-white/30 hover:text-white/60'}
                                ${t === 'collector' ? 'opacity-30' : ''}`}
                        >
                            {t}
                            {t === 'collector' && <span className="ml-2 text-[8px] tracking-widest text-white/25">Soon</span>}
                            {formData.type === t && (
                                <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                            )}
                        </button>
                    ))}
                </div>

                {formData.type === 'collector' ? (
                    <div className="py-24 text-center animate-fade-in">
                        <p className="text-white/30 text-sm">Collector profiles are coming soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-20 items-start">

                        {/* Left: Requirements */}
                        <div className="space-y-10 animate-fade-in">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-6">
                                    {formData.type === 'artist' ? 'Requirements' : 'Gallery Requirements'}
                                </p>

                                {formData.type === 'artist' ? (
                                    <div className="space-y-6 divide-y divide-white/6">
                                        <div className="space-y-2">
                                            <p className="text-sm text-white font-semibold leading-snug">Own a dedicated website with a custom domain.</p>
                                            <p className="text-xs text-white/40 leading-relaxed">No Linktree, no direct marketplace or social links. A personal website is required — applications without one will be declined.</p>
                                        </div>
                                        <div className="space-y-2 pt-6">
                                            <p className="text-sm text-white font-semibold leading-snug">Identity & narrative present on the site.</p>
                                            <p className="text-xs text-white/40 leading-relaxed">Bio, highlights, exhibitions — something that gives context to who you are and what you make. Relevant links to marketplaces and social are welcome.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 divide-y divide-white/6">
                                        <div className="space-y-2">
                                            <p className="text-sm text-white font-semibold">Established platform or curated gallery.</p>
                                        </div>
                                        <div className="space-y-2 pt-6">
                                            <p className="text-sm text-white font-semibold">Clear curatorial mission & preservation focus.</p>
                                        </div>
                                        <div className="space-y-2 pt-6">
                                            <p className="text-sm text-white font-semibold">Cohesive visual identity & art-first experience.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-[10px] text-white/25 leading-relaxed">
                                Ensure your website loads inside an iframe. Use the Test button in the form to verify.
                            </p>
                        </div>

                        {/* Right: Form */}
                        <div className="animate-fade-in">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Thumbnail Upload */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Thumbnail</p>
                                    <div className="relative w-full aspect-[25/16] max-h-44 md:max-h-none border border-white/10 hover:border-white/25 transition-colors cursor-pointer overflow-hidden group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 z-50 cursor-pointer"
                                        />
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                                <div className="absolute bottom-0 inset-x-0 p-5 pointer-events-none">
                                                    <p className="text-base font-bold text-white tracking-tight">{formData.name || 'Your Name'}</p>
                                                    <p className="text-xs text-white/50 mt-0.5">{formData.subtitle || 'Your tagline'}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">High-Resolution Thumbnail</p>
                                                <p className="text-[9px] text-white/20 leading-relaxed">
                                                    1024px minimum — quality is priority
                                                    {formData.type === 'artist' && <><br />Silhouette or portrait preferred</>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">
                                        {formData.type === 'artist' ? 'Artist Name' : 'Gallery Name'}
                                    </p>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-transparent border-b border-white/15 py-2.5 text-sm text-white focus:border-white/50 outline-none transition-colors placeholder-white/20"
                                        placeholder={formData.type === 'artist' ? 'e.g. XCOPY' : 'e.g. Verse, Art Blocks'}
                                    />
                                </div>

                                {/* Subtitle */}
                                <div className="relative">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Subtitle</p>
                                    <input
                                        type="text"
                                        required
                                        maxLength={35}
                                        value={formData.subtitle}
                                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                        className="w-full bg-transparent border-b border-white/15 py-2.5 text-sm text-white focus:border-white/50 outline-none transition-colors placeholder-white/20 pr-10"
                                        placeholder={formData.type === 'artist' ? 'e.g. Crypto Artist' : 'e.g. Curatorial mission'}
                                    />
                                    <span className="absolute right-0 bottom-3 text-[10px] text-white/20 pointer-events-none">{formData.subtitle.length}/35</span>
                                </div>

                                {/* Website */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Website URL</p>
                                    <div className="flex gap-3 items-end border-b border-white/15 focus-within:border-white/50 transition-colors">
                                        <input
                                            type="url"
                                            required
                                            value={formData.websiteUrl}
                                            onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                            className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder-white/20"
                                            placeholder="https://your-website.com"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsTesterOpen(true)}
                                            className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                                        >
                                            Test
                                        </button>
                                    </div>
                                </div>

                                {/* Status */}
                                {status && (
                                    <p className={`text-xs py-3 border-b ${status.type === 'success' ? 'text-white/70 border-white/10' : 'text-red-400/80 border-red-500/20'}`}>
                                        {status.message}
                                    </p>
                                )}

                                {/* Submit */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] border transition-colors duration-200 flex items-center justify-center gap-3
                                            ${isSubmitting
                                                ? 'border-white/10 text-white/30 cursor-wait'
                                                : 'border-white/20 text-white/80 hover:border-white/40 hover:text-white cursor-pointer'}`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <SquareLoader className="w-3.5 h-3.5" label="Sending application" strokeWidth={1.1} />
                                                Sending
                                            </>
                                        ) : (
                                            'Submit Application'
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
