import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { IframeTester } from '../components/IframeTester';


export function SubmitArtist() {
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        subtitle: '',
        websiteUrl: '',
        email: '',
        type: 'artist' as 'artist' | 'gallery' | 'collector'
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // UI State
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
        if (formData.type === 'collector') return; // Prevent submission for now

        const normalizedEmail = formData.email.trim();

        setIsSubmitting(true);
        setStatus(null);

        try {
            // Create FormData for the backend
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('subtitle', formData.subtitle);
            submitData.append('websiteUrl', formData.websiteUrl);
            submitData.append('email', normalizedEmail);
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

            setStatus({ type: 'success', message: 'Application submitted successfully! We will review it shortly.' });
            setFormData({ name: '', subtitle: '', websiteUrl: '', email: '', type: formData.type });
            setThumbnailFile(null);
            setPreviewUrl(null);

        } catch (err: any) {
            console.error('Submission failed:', err);

            // Extract meaningful info
            const isCorsError = err.message === 'Failed to fetch' || err.name === 'TypeError';

            let errorMsg = err.message || 'Submission failed';

            if (isCorsError) {
                errorMsg = 'Network Error: Please check your connection or wait a moment.';
            }

            setStatus({
                type: 'error',
                message: errorMsg
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen xl:h-auto bg-black text-white selection:bg-white/20 overflow-y-auto overflow-x-hidden flex flex-col items-center">
            <Helmet>
                <title>Apply | CATALOGUE</title>
            </Helmet>

            <IframeTester isOpen={isTesterOpen} onClose={() => setIsTesterOpen(false)} />

            {/* Close Button */}
            <Link
                to="/info"
                className="fixed top-8 right-8 z-50 px-3 py-2 bg-[#0c0c0c] border border-white/10  text-white/45 hover:text-white hover:border-white/25 transition-colors duration-300 group"
                title="Exit Application"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </Link>

            <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 xl:px-20 pt-24 lg:pt-36 pb-10 flex flex-col animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[38%_62%] gap-12 lg:gap-16 xl:gap-24 items-start min-h-0 lg:min-h-[500px]">

                    {/* Left Column: Context & Requirements */}
                    <div className="space-y-6 md:space-y-8 xl:space-y-12 xl:pr-12">
                        {/* Header */}
                        <div className="space-y-3 xl:space-y-4">
                            <h1 className="text-3xl md:text-4xl xl:text-5xl font-black uppercase tracking-[0.12em] leading-none">Apply to <br /> Catalogue</h1>
                            <p className="text-white/40 font-mono text-[8px] md:text-[10px] uppercase tracking-widest leading-relaxed">
                                For Collectors, from the lens of the artists.
                            </p>
                        </div>

                        {/* Type Selector Tabs */}
                        <div className="flex bg-[#0d0d0d] p-1  border border-white/10 w-full max-w-sm">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'artist' })}
                                className={`flex-1 py-1.5 md:py-2 text-[10px] font-bold uppercase tracking-widest  border transition-colors cursor-pointer ${formData.type === 'artist' ? 'bg-[#141414] text-white border-white/20' : 'text-white/45 border-transparent hover:text-white hover:border-white/12'}`}
                            >
                                Artist
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'gallery' })}
                                className={`flex-1 py-1.5 md:py-2 text-[10px] font-bold uppercase tracking-widest  border transition-colors cursor-pointer ${formData.type === 'gallery' ? 'bg-[#141414] text-white border-white/20' : 'text-white/45 border-transparent hover:text-white hover:border-white/12'}`}
                            >
                                Gallery
                            </button>
                            <button
                                type="button"
                                disabled
                                className="group relative flex-1 py-1.5 md:py-2  border border-transparent cursor-not-allowed opacity-35"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Collector</span>
                                <span className="absolute inset-x-0 -bottom-4 text-center text-[8px] font-mono uppercase tracking-widest text-white/25 whitespace-nowrap">Soon</span>
                            </button>
                        </div>

                        {/* Requirements Section - Reduced height for tablets */}
                        <div className="min-h-0 xl:min-h-[220px]">
                            <div className="space-y-5 xl:space-y-6 animate-fade-in">
                                <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/80 pb-2 border-b border-white/20">
                                    {formData.type === 'artist' ? 'Entry Requirements' : 'Gallery Requirements'}
                                </h2>

                                {formData.type === 'artist' ? (
                                    <ul className="space-y-4 text-xs text-white/90 font-mono leading-relaxed">
                                        <li className="flex gap-4">
                                            <span className="text-white/55 font-bold shrink-0">01</span>
                                            <div className="space-y-1">
                                                <span className="text-white font-bold">Dedicated personal website with a custom domain.</span>
                                                <ul className="space-y-1 opacity-80 text-[10px]">
                                                    <li>• No Linktree, no direct links to marketplaces, social media, etc.</li>
                                                    <li>• Without a dedicated website, your application will be declined.</li>
                                                </ul>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-white/55 font-bold shrink-0">02</span>
                                            <div className="space-y-1">
                                                <span className="text-white font-bold">Identity & Narrative (on your website):</span>
                                                <ul className="space-y-1 opacity-80 text-[10px]">
                                                    <li>• Bio, Highlights, Exhibitions etc.</li>
                                                    <li>• Visually pertaining to your work.</li>
                                                    <li>• Relevant links: marketplace, social media etc.</li>
                                                </ul>
                                            </div>
                                        </li>
                                    </ul>
                                ) : (
                                    <ul className="space-y-4 text-xs text-white/70 font-mono leading-relaxed">
                                        <li className="flex gap-4">
                                            <span className="text-white/55 font-bold shrink-0">01</span>
                                            <span className="text-white">Established platform or curated gallery.</span>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-white/55 font-bold shrink-0">02</span>
                                            <span className="text-white">Clear curatorial mission & preservation focus.</span>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-white/55 font-bold shrink-0">03</span>
                                            <span className="text-white">Cohesive visual identity & art-first experience.</span>
                                        </li>
                                    </ul>
                                )}

                                <div className="p-3 bg-[#0d0d0d] border border-white/10 ">
                                    <p className="text-[10px] text-white/30 font-mono italic">
                                        * Ensure your website is iframe-compatible.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Form */}
                    <div className="bg-[#0d0d0d] border border-white/10 p-6 md:p-8  space-y-4 md:space-y-5 flex flex-col items-center">

                        {formData.type === 'collector' ? (
                            <div className="py-20 text-center space-y-4 animate-fade-in w-full">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Collector Profiles</h2>
                                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">System Integration Pending</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center justify-center gap-4 h-full max-w-2xl mx-auto">

                                {/* Top: Card Preview / Upload */}
                                {/* Aspect Ratio matches Homepage (600w x 384h = 1.5625) ~25/16 */}
                                <div className="flex flex-col w-full items-center">
                                    <div className="relative w-full max-w-[500px] aspect-[25/16] bg-[#0b0b0b] border border-white/10  overflow-hidden group hover:border-white/25 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 z-50 cursor-pointer"
                                        />

                                        {/* Image Layer */}
                                        <div className="absolute inset-0 z-0">
                                            {previewUrl ? (
                                                <>
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    {/* Gradient Overlay - only when image is present */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black p-4">
                                                    <div className="text-center max-w-[280px]">
                                                        <span className="text-[10px] md:text-[11px] uppercase font-black tracking-[0.2em] text-white/60 block mb-2">
                                                            Upload
                                                        </span>
                                                        <span className="text-[9px] md:text-[10px] uppercase font-black tracking-[0.12em] md:tracking-[0.15em] text-white block mb-2">
                                                            High-Resolution Thumbnail
                                                        </span>
                                                        <span className="text-[8px] md:text-[9px] uppercase font-mono tracking-wide md:tracking-wider text-white/50 block leading-relaxed">
                                                            Required: 1024px+<br />
                                                            Quality is priority
                                                            {formData.type === 'artist' && (
                                                                <><br />Silhouette / portrait preferred</>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Text Content (Simulated) - Only show when image is uploaded */}
                                        {previewUrl && (
                                            <div className="absolute bottom-0 inset-x-0 p-6 z-10 pointer-events-none">
                                                <h3 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
                                                    {formData.name || 'Your Name'}
                                                </h3>
                                                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                                                    {formData.subtitle || 'Your subtitle or tagline...'}
                                                </p>

                                                {/* Action Indicator */}
                                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors opacity-100 transform translate-y-0 duration-500">
                                                    <span>Explore Universe</span>
                                                    <span className="text-lg">→</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom: Text Inputs (Thinner Padding) */}
                                <div className="space-y-2 w-full max-w-[500px]">
                                    {/* Name */}
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-[#090909] border border-white/10  px-4 py-2.5 text-sm font-mono text-white focus:border-white/30 outline-none transition-colors placeholder-white/20"
                                            placeholder={formData.type === 'artist' ? "Artist Name (e.g. XCOPY)" : "Gallery Name (e.g. Verse, Sovrn, Art Blocks etc.)"}
                                        />
                                    </div>

                                    {/* Subtitle */}
                                    <div className="space-y-1 relative">
                                        <input
                                            type="text"
                                            required
                                            maxLength={35}
                                            value={formData.subtitle}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full bg-[#090909] border border-white/10  px-4 py-2.5 text-sm font-mono text-white focus:border-white/30 outline-none transition-colors placeholder-white/20"
                                            placeholder={formData.type === 'artist' ? "Subtitle / Tagline (e.g. Crypto Artist)" : "Subtitle (e.g. Curatorial Mission)"}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 pointer-events-none">
                                            {formData.subtitle.length}/35
                                        </div>
                                    </div>

                                    {/* Website with Tester */}
                                    <div className="space-y-1 flex gap-2">
                                        <input
                                            type="url"
                                            required
                                            value={formData.websiteUrl}
                                            onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                            className="w-full bg-[#090909] border border-white/10  px-4 py-2.5 text-sm font-mono text-white focus:border-white/30 outline-none transition-colors placeholder-white/20"
                                            placeholder="https://your-website.com"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsTesterOpen(true)}
                                            className="px-4 py-2.5 bg-[#101010] border border-white/10  text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:border-white/25 transition-colors whitespace-nowrap"
                                        >
                                            Test
                                        </button>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1">
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-[#090909] border border-white/10  px-4 py-2 text-sm font-mono text-white focus:border-white/30 outline-none transition-colors placeholder-white/20"
                                            placeholder="Email Address"
                                        />
                                    </div>

                                    {/* Status Message */}
                                    {status && (
                                        <div className={`p-2  text-[10px] font-mono text-center ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {status.message}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full font-black uppercase tracking-[0.2em] py-3  transition-colors mt-1 flex items-center justify-center gap-3 ${isSubmitting ? 'bg-[#0f0f0f] text-white/50 border border-white/10 cursor-wait' : 'bg-[#141414] border border-white/20 text-white hover:bg-[#1a1a1a] hover:border-white/30 cursor-pointer'}`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="text-[10px] tracking-widest">Sending... Do Not Close</span>
                                            </>
                                        ) : (
                                            `Submit Application`
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
