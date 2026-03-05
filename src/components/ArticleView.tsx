import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useArtists } from '../hooks/useArtists';
import { processArticleContent } from '../utils/linkUtils';
import { Helmet } from 'react-helmet-async';
import type { ArticleRecord } from '../types/article';

interface ArticleViewProps {
    articles: ArticleRecord[];
    loading?: boolean;
}

function resolveSiteOrigin() {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '');
    }
    return 'https://catalogue.gallery';
}

function toAbsoluteImageUrl(url: string | undefined) {
    const siteOrigin = resolveSiteOrigin();
    if (!url) return `${siteOrigin}/logo.png`;
    if (/^https?:\/\//i.test(url)) return url;
    return `${siteOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ articles, loading = false }) => {
    const { id } = useParams<{ id: string }>();
    const { artists } = useArtists();
    const article = articles.find(a => a.id === id);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading && !article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-xs text-white/40 font-mono uppercase tracking-widest">Loading article...</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p className="text-white/50 mb-8">Article not found.</p>
                    <Link to="/blog" className="px-6 py-3 bg-[#0d0d0d] border border-white/10 hover:bg-[#121212] transition-colors">
                        Return to Archives
                    </Link>
                </div>
            </div>
        );
    }

    const socialImage = toAbsoluteImageUrl(article.thumbnailUrl);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
            <Helmet>
                <title>{`${article.title} | CATALOGUE`}</title>
                <meta name="description" content={article.excerpt} />
                <meta property="og:title" content={article.title} />
                <meta property="og:description" content={article.excerpt} />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:image" content={socialImage} />
                <meta name="twitter:title" content={article.title} />
                <meta name="twitter:description" content={article.excerpt} />
                <meta name="twitter:image" content={socialImage} />
            </Helmet>

            {/* Article Content */}
            <article className="pt-28 md:pt-24 pb-32 px-6 max-w-4xl mx-auto">
                <header className="mb-16 text-center border-b border-white/10 pb-10">
                    <div className="inline-block mb-6">
                        <span className="px-3 py-1 border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                            {article.type}
                        </span>
                    </div>
                    {article.title.includes(':') ? (
                        <>
                            <h1 className="text-2xl md:text-3xl font-black tracking-widest mb-6 leading-tight text-white uppercase break-words max-w-3xl mx-auto">
                                {article.title.split(':')[0]}:
                            </h1>
                            <div className="w-16 h-px bg-white/20 mx-auto mb-6"></div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-8 text-white/80 max-w-3xl mx-auto leading-normal">
                                {article.title.split(':')[1]}
                            </h2>
                        </>
                    ) : (
                        <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-8 leading-tight text-white uppercase break-words max-w-3xl mx-auto">
                            {article.title}
                        </h1>
                    )}
                    <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] border-t border-white/10 pt-6 max-w-md mx-auto relative">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.author}</span>
                        <span>•</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 hover:text-white transition-colors duration-300 relative group"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            <span>{copied ? 'Copied' : 'Share'}</span>

                            {/* Tooltip feedback */}
                            {copied && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] px-2 py-1 font-bold animate-fade-in whitespace-nowrap">
                                    Copied
                                </div>
                            )}
                        </button>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto">
                    <ReactMarkdown
                        components={{
                            h1: () => null,
                            h2: (props) => <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.1em] mb-6 mt-16 text-white border-b border-white/10 pb-2" {...props} />,
                            h3: (props) => <h3 className="text-sm font-bold uppercase tracking-widest mb-4 mt-8 text-white/80" {...props} />,
                            p: (props) => <p className="text-base md:text-lg leading-relaxed text-white/80 mb-6 font-light" {...props} />,
                            strong: (props) => <strong className="font-bold text-white" {...props} />,
                            em: (props) => <em className="italic text-white/80" {...props} />,
                            blockquote: (props) => (
                                <blockquote className="my-12 pl-6 border-l-2 border-white text-xl md:text-2xl font-light italic text-white/90 leading-normal" {...props} />
                            ),
                            ul: (props) => <ul className="list-disc list-outside ml-6 mb-6 text-white/70 space-y-2" {...props} />,
                            li: (props) => <li className="pl-2" {...props} />,
                            code: (props) => <code className="bg-white/10 px-2 py-1 text-xs font-mono text-white/90" {...props} />,
                            a: ({ href, children, ...props }) => {
                                const isInternal = href?.startsWith('/') || href?.includes(window.location.host);
                                if (isInternal) {
                                    return <Link to={href || '#'} className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-all font-bold" {...props}>{children}</Link>;
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-all font-bold" {...props}>{children}</a>;
                            }
                        }}
                    >
                        {processArticleContent(article.content, artists)}
                    </ReactMarkdown>
                </div>

                {/* Footer Section */}
                <hr className="my-20 border-white/10" />
                <div className="flex items-center justify-between">
                    <Link to="/blog" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                        ← Archives
                    </Link>
                    <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                        Home →
                    </Link>
                </div>
            </article>
        </div>
    );
};
