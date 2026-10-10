import { Helmet } from 'react-helmet-async';
import { absoluteImage, canonicalUrl, type PageMeta } from '../lib/seo';
export function Seo({ meta }: { meta: PageMeta }) {
    const url = canonicalUrl(meta.path); const image = absoluteImage(meta.image);
    return <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content={meta.noindex ? 'noindex, follow' : 'index, follow'} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content={meta.type || 'website'} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:image" content={image} />
    </Helmet>;
}
