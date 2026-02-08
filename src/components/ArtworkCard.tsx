import React, { useState } from 'react';
import type { Artist, Artwork } from '../types';

interface ArtworkCardProps {
    artwork: Artwork;
    artist?: Artist;
    simple?: boolean;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, artist, simple = false }) => {
    let imgSrc = '';

    if (artist?.template === 'onchain') {
        imgSrc = `https://ordinals.com/content/${artwork.id}`;
    } else {
        const ext = artwork.artwork_type === 'JPEG' ? 'jpg' : 'png';
        imgSrc = `https://cdn.lemonhaze.com/assets/assets/${artwork.id}.${ext}`;
    }

    const [useIframe, setUseIframe] = useState(false);

    if (useIframe) {
        if (simple) {
            // Slideshow Mode: Standard Iframe (No Scaling)
            return (
                <div className="w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
                    <iframe
                        src={imgSrc}
                        className="w-full h-full border-0"
                        title={artwork.name}
                    />
                </div>
            );
        }

        // Grid Mode: Scaled Thumbnail
        return (
            <div className="w-full h-full relative overflow-hidden bg-transparent">
                <iframe
                    src={imgSrc}
                    className="absolute top-0 left-0 border-0 pointer-events-none"
                    style={{
                        width: '600%',
                        height: '600%',
                        transform: 'scale(0.1666)',
                        transformOrigin: 'top left'
                    }}
                    scrolling="no"
                    title={artwork.name}
                />
                <div className="absolute inset-0 z-10"></div>
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={artwork.name}
            onError={() => setUseIframe(true)}
            className={`object-contain transition-transform duration-500 ${simple ? 'max-w-full max-h-full w-auto h-auto p-0' : 'w-full h-full p-4 group-hover:scale-105'} ${artwork.artwork_type === 'PNG' ? 'image-pixelated' : ''}`}
            loading="lazy"
        />
    );
};
