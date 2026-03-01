import React from 'react';
import { useParams } from 'react-router-dom';
import { useArtists } from '../../hooks/useArtists';
import { PortfolioTemplateV2 } from './PortfolioTemplateV2';

export const PortfolioV2: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { artists, loading } = useArtists();

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 tracking-widest uppercase text-xs">Initializing...</div>;

    // a.id is already coalesced from slug.current in the GROQ projection
    const artist = artists.find(a => a.id === id);

    if (!artist) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Artist not found</div>;
    }

    return <PortfolioTemplateV2 artist={artist} />;
};
