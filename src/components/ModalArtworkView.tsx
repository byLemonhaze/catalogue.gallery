import React, { useState } from 'react';
import type { Artist, Artwork } from '../types';

interface ModalArtworkViewProps {
    artwork: Artwork;
    artist?: Artist;
    className?: string;
}

export const ModalArtworkView: React.FC<ModalArtworkViewProps> = ({ artwork, artist, className }) => {
    let imgSrc = '';
    if (artist?.template === 'onchain') {
        imgSrc = `https://ordinals.com/content/${artwork.id}`;
    } else {
        const ext = artwork.artwork_type === 'JPEG' ? 'jpg' : 'png';
        imgSrc = `https://cdn.lemonhaze.com/assets/assets/${artwork.id}.${ext}`;
    }

    const [useIframe, setUseIframe] = useState(false);

    if (useIframe) {
        return (
            <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                <iframe
                    src={imgSrc}
                    className="w-full h-full border-0"
                    title={artwork.name}
                />
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            onError={() => setUseIframe(true)}
            className={`max-w-full w-auto h-auto object-contain drop-shadow-2xl ${className || 'max-h-[60vh] md:max-h-[85vh]'}`}
        />
    );
};
