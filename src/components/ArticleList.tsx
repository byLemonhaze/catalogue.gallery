import React from 'react';
import { Link } from 'react-router-dom';
import type { ArticleRecord } from '../types/article';
interface ArticleListProps {
    filter?: 'interview' | 'blog' | 'all';
    articles: ArticleRecord[];
    loading?: boolean;
}

import { Helmet } from 'react-helmet-async';

export const ArticleList: React.FC<ArticleListProps> = ({ filter = 'all', articles, loading = false }) => {
    const filteredArticles = articles.filter(article => {
        if (filter === 'interview') return article.type === 'Interview';
        return true;
    });

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet>
                <title>Content Lab Archives | CATALOGUE</title>
            </Helmet>

            <div className="pt-28 md:pt-24 px-6 max-w-4xl mx-auto pb-32">

                {/* Page Header */}
                <div className="mb-16 md:mb-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Content Lab</p>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none text-white">
                        Archives
                    </h1>
                </div>

                {loading && filteredArticles.length === 0 ? (
                    <div className="text-white/40 text-xs font-mono uppercase tracking-widest">Loading archives...</div>
                ) : (
                    <div className="space-y-0">
                        {filteredArticles.map((article, i) => (
                            <Link
                                key={article.id}
                                to={`/blog/${article.id}`}
                                className={`group flex gap-6 md:gap-8 py-8 border-b border-white/8 hover:border-white/20 transition-colors duration-300 ${i === 0 ? 'border-t border-white/8' : ''}`}
                            >
                                {/* Thumbnail */}
                                <div className="w-20 h-20 md:w-28 md:h-20 shrink-0 overflow-hidden bg-white/5">
                                    <img
                                        src={article.thumbnailUrl || '/logo.png'}
                                        alt=""
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 border border-white/10 px-2 py-0.5">
                                            {article.type}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/25">{article.date}</span>
                                    </div>

                                    <h2 className="text-base md:text-lg font-bold text-white leading-snug tracking-tight mb-2 group-hover:text-white/80 transition-colors">
                                        {article.title}
                                    </h2>

                                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 max-w-2xl">
                                        {article.excerpt}
                                    </p>
                                </div>

                                <div className="hidden md:flex items-center shrink-0 text-white/20 group-hover:text-white/50 transition-colors pr-1">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
