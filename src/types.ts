
export interface Artist {
    id: string;
    name: string;
    thumbnail?: string;
    description: string;
    websiteUrl?: string;
    template?: string;
    provenanceUrl?: string;
    badge?: string;
    type?: string; // artist or collection
    bio?: string;
    exhibitions?: string[];
    press?: { title: string; url: string }[];
    marketplace?: { title: string; url: string }[];
}

export interface Artwork {
    id: string; // The inscription ID or asset ID
    name: string;
    collection: string;
    artwork_type?: string; // e.g. 'PNG', 'JPEG'
    provenance?: string;
    timestamp?: string;
    dimensions?: string;
    size?: string;
    sat?: string;
    height?: string;
    content_type?: string;
    content_size?: string;
    fee?: string;
}
