import { urlFor } from '../sanity/image';
import type { ThumbnailSource } from '../types/sanity';

interface ArtistProps {
    id: string;
    name: string;
    thumbnail: ThumbnailSource;
    subtitle: string;
    websiteUrl?: string; // Optional custom URL
    badge?: string; // Optional custom badge text
    type?: string; // artist or collection
    isSanity?: boolean;
}

export const ArtistCard: React.FC<ArtistProps> = ({ name, thumbnail, subtitle, isSanity }) => {
    // Resolve image URL
    const imageUrl = isSanity && thumbnail
        ? urlFor(thumbnail).width(800).url()
        : (typeof thumbnail === 'string' ? thumbnail : undefined);

    return (
        <div
            className="group relative flex flex-col h-96 bg-[#0c0c0c] border border-white/10 overflow-hidden transition-colors duration-300 hover:border-white/25 cursor-default"
        >
            {/* Image Container - Visual only, parent handles click */}
            <div className="flex-1 relative overflow-hidden cursor-pointer block">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60 pointer-events-none" />
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#101010]">
                        <span className="text-9xl font-bold text-white/20 uppercase">{name.charAt(0)}</span>
                    </div>
                )}
            </div>

            {/* Content Container - Visual only, strictly non-interactive to pass clicks to the Link behind */}
            <div className="absolute bottom-0 inset-x-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none">
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-white transition-colors">
                    {name}
                </h3>
                <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                    {subtitle}
                </p>

                {/* Action Indicator */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100 text-white/50 text-lg">
                    →
                </div>
            </div>
        </div>
    );
};
