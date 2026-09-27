import type { ChangeEventHandler, RefObject } from 'react';
import { THUMBNAIL_TYPES } from '../../shared/submission';

type Props = {
    name: string;
    subtitle: string;
    type: string;
    previewUrl: string | null;
    error?: string | null;
    fileInput: RefObject<HTMLInputElement | null>;
    onChange: ChangeEventHandler<HTMLInputElement>;
};

export function ApplicationThumbnailField({ name, subtitle, type, previewUrl, error, fileInput, onChange }: Props) {
    return (
        <>
            {/* Thumbnail Upload */}
            <div>
                <label htmlFor="thumbnail" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Thumbnail / Profile Image</label>
                <div className={`relative w-full aspect-[25/16] max-h-44 md:max-h-none border ${error ? 'border-red-400/70' : 'border-white/10 hover:border-white/25'} transition-colors cursor-pointer overflow-hidden group`}>
                    <input
                        id="thumbnail"
                        name="thumbnail"
                        ref={fileInput}
                        type="file"
                        required
                        accept={THUMBNAIL_TYPES.join(',')}
                        aria-describedby="image-help image-error"
                        aria-invalid={Boolean(error)}
                        onChange={onChange}
                        className="absolute inset-0 opacity-0 z-50 cursor-pointer"
                    />
                    {previewUrl ? (
                        <>
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-0 inset-x-0 p-5 pointer-events-none">
                                <p className="text-base font-bold text-white tracking-tight">{name || 'Your Name'}</p>
                                <p className="text-xs text-white/50 mt-0.5">{subtitle || 'Your tagline'}</p>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">High-Resolution Thumbnail</p>
                            <p className="text-[9px] text-white/20 leading-relaxed">
                                1024px minimum — quality is priority
                                {type === 'artist' && <><br />Silhouette or portrait preferred</>}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p id="image-help" className="text-[10px] text-white/40">JPG, PNG, WebP or GIF · up to 10 MB</p>
            <p id="image-error" role="alert" className="text-xs text-red-400">{error}</p>

        </>
    );
}
