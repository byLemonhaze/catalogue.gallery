import { Helmet } from 'react-helmet-async';
import { useApplicationForm } from '../hooks/useApplicationForm';
import { ApplicationThumbnailField } from '../components/ApplicationThumbnailField';
import { ApplicationWebsiteField } from '../components/ApplicationWebsiteField';
import { SquareLoader } from '../components/SquareLoader';


export function SubmitArtist() {
    const { formData, setFormData, previewUrl, imageError, fieldErrors, fileInput, embedCheck, isSubmitting, status, submitDisabled, handleFileChange, handleSubmit } = useApplicationForm();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-y-auto overflow-x-hidden">
            <Helmet>
                <title>Apply | CATALOGUE</title>
            </Helmet>

            <div className="max-w-5xl mx-auto w-full px-6 lg:px-12 pt-28 md:pt-32 pb-24 animate-fade-in">

                {/* Page Header */}
                <div className="mb-16 md:mb-20">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#c7c7c7] mb-4">Apply</p>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none text-white mb-6">
                        Join the directory
                    </h1>
                    <p className="text-[#d1d1d1] text-base max-w-xl leading-7">
                        CATALOGUE connects collectors directly to artist-owned websites — unfiltered, self-curated, and independent. Each listing is reviewed before publishing.
                    </p>
                </div>

                {/* Type Selector */}
                <div className="flex flex-wrap gap-x-6 gap-y-3 mb-10 border-b border-white/20 pb-0">
                    {(['artist', 'gallery', 'collector'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            disabled={t === 'collector' || isSubmitting}
                            onClick={() => t !== 'collector' && setFormData({ ...formData, type: t })}
                            className={`relative min-h-11 pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-200 cursor-pointer disabled:cursor-default
                                ${formData.type === t ? 'text-white' : 'text-[#b5b5b5] hover:text-white'}
                                `}
                        >
                            {t}
                            {t === 'collector' && <span className="ml-2 text-[10px] tracking-widest text-[#c7c7c7]">Soon</span>}
                            {formData.type === t && (
                                <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                            )}
                        </button>
                    ))}
                </div>

                {formData.type === 'collector' ? (
                    <div className="py-24 text-center animate-fade-in">
                        <p className="text-[#c7c7c7] text-sm">Collector profiles are coming soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-10 items-start">

                        {/* Left: Requirements */}
                        <div className="space-y-8 border border-[#3d3d3d] bg-[#141414] p-6 animate-fade-in">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c7c7c7] mb-6">
                                    {formData.type === 'artist' ? 'Requirements' : 'Gallery Requirements'}
                                </p>

                                {formData.type === 'artist' ? (
                                    <div className="space-y-6 divide-y divide-white/20">
                                        <div className="space-y-2">
                                            <p className="text-sm text-white font-semibold leading-snug">Own a dedicated website with a custom domain.</p>
                                            <p className="text-sm text-[#c7c7c7] leading-relaxed">No Linktree, no direct marketplace or social links. A personal website is required — applications without one will be declined.</p>
                                        </div>
                                        <div className="space-y-2 pt-6">
                                            <p className="text-sm text-white font-semibold leading-snug">Identity & narrative present on the site.</p>
                                            <p className="text-sm text-[#c7c7c7] leading-relaxed">Bio, highlights, exhibitions — something that gives context to who you are and what you make. Relevant links to marketplaces and social are welcome.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 divide-y divide-white/20">
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

                            <p className="text-sm text-[#c7c7c7] leading-relaxed">
                                Your website must allow embedding on catalogue.gallery. We check its permissions automatically when you enter the URL.
                            </p>
                        </div>

                        {/* Right: Form */}
                        <div className="border border-[#3d3d3d] bg-[#191919] p-5 md:p-7 animate-fade-in">
                            <form noValidate onSubmit={handleSubmit} className="space-y-5">
                                <p className="text-sm leading-relaxed text-[#d1d1d1]">All fields are required. Your website must pass the automatic embedding check before your application can be sent.</p>
                                <fieldset disabled={isSubmitting} className="space-y-5 disabled:opacity-60">

                                    <ApplicationThumbnailField
                                        name={formData.name}
                                        subtitle={formData.subtitle}
                                        type={formData.type}
                                        previewUrl={previewUrl}
                                        error={imageError}
                                        fileInput={fileInput}
                                        onChange={handleFileChange}
                                    />

                                    {/* Name */}
                                    <div>
                                        <label htmlFor="applicant-name" className="block text-xs font-bold uppercase tracking-[0.2em] text-[#c7c7c7] mb-2">
                                            {formData.type === 'artist' ? 'Artist Name' : 'Gallery Name'}
                                        </label>
                                        <input
                                            id="applicant-name"
                                            name="name"
                                            aria-invalid={Boolean(fieldErrors.name)}
                                            aria-describedby="applicant-name-error"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-[#111111] border border-[#707070] aria-invalid:border-red-400 px-3 py-3 text-base text-white focus:border-white outline-none transition-colors placeholder:text-[#a3a3a3]"
                                            placeholder={formData.type === 'artist' ? 'e.g. XCOPY' : 'e.g. Verse, Art Blocks'}
                                        />
                                        {fieldErrors.name && <p id="applicant-name-error" className="mt-2 text-xs text-red-400">{fieldErrors.name}</p>}
                                    </div>

                                    {/* Subtitle */}
                                    <div className="relative">
                                        <label htmlFor="subtitle" className="block text-xs font-bold uppercase tracking-[0.2em] text-[#c7c7c7] mb-2">Subtitle</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={35}
                                            id="subtitle"
                                            name="subtitle"
                                            aria-invalid={Boolean(fieldErrors.subtitle)}
                                            aria-describedby="subtitle-error"
                                            value={formData.subtitle}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full bg-[#111111] border border-[#707070] aria-invalid:border-red-400 px-3 py-3 text-base text-white focus:border-white outline-none transition-colors placeholder:text-[#a3a3a3] pr-10"
                                            placeholder={formData.type === 'artist' ? 'e.g. Crypto Artist' : 'e.g. Curatorial mission'}
                                        />
                                        <span className="absolute right-3 top-11 text-xs text-[#c7c7c7] pointer-events-none">{formData.subtitle.length}/35</span>
                                        {fieldErrors.subtitle && <p id="subtitle-error" className="mt-2 text-xs text-red-400">{fieldErrors.subtitle}</p>}
                                    </div>

                                    <ApplicationWebsiteField
                                        value={formData.websiteUrl}
                                        onChange={websiteUrl => setFormData({ ...formData, websiteUrl })}
                                        check={embedCheck}
                                        error={fieldErrors.websiteUrl}
                                    />

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-[0.2em] text-[#c7c7c7] mb-2">Contact Email</label>
                                        <input
                                            type="email"
                                            required
                                            id="contact-email"
                                            name="email"
                                            aria-invalid={Boolean(fieldErrors.email)}
                                            aria-describedby="contact-email-error"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-[#111111] border border-[#707070] aria-invalid:border-red-400 px-3 py-3 text-base text-white focus:border-white outline-none transition-colors placeholder:text-[#a3a3a3]"
                                            placeholder="your@email.com"
                                        />
                                        {fieldErrors.email && <p id="contact-email-error" className="mt-2 text-xs text-red-400">{fieldErrors.email}</p>}
                                    </div>

                                </fieldset>

                                {/* Status */}
                                {status && (
                                    <p role="alert" className={`text-xs py-3 border-b ${status.type === 'success' ? 'text-white/70 border-white/10' : 'text-red-400/80 border-red-500/20'}`}>
                                        {status.message}
                                    </p>
                                )}

                                {/* Submit */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitDisabled}
                                        className={`w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] border transition-colors duration-200 flex items-center justify-center gap-3
                                            ${isSubmitting
                                                ? 'border-[#707070] bg-[#333333] text-[#ededed] cursor-wait'
                                                : submitDisabled ? 'border-[#707070] bg-[#333333] text-[#c7c7c7] cursor-not-allowed'
                                                : 'border-[#f2f2ef] bg-[#f2f2ef] text-[#111111] hover:bg-white cursor-pointer'}`}
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
