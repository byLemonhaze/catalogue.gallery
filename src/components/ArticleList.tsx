import React from 'react';
import { Link } from 'react-router-dom';
import { articles } from '../data/articles';
interface ArticleListProps {
    filter?: 'interview' | 'blog' | 'all';
}

import { Helmet } from 'react-helmet-async';

export const ArticleList: React.FC<ArticleListProps> = ({ filter = 'all' }) => {
    // Filter articles logic
    const filteredArticles = articles.filter(article => {
        if (filter === 'interview') return article.type === 'Interview';
        return true; // Both 'all' and 'blog' will now show everything
    });


    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Helmet>
                <title>Archives | CATALOGUE</title>
            </Helmet>
            <div className="pt-44 md:pt-40 p-6 max-w-4xl mx-auto min-h-screen">



                <div className="grid grid-cols-1 gap-4 mt-8 md:mt-12">
                    {filteredArticles.map(article => (
                        <Link
                            key={article.id}
                            to={`/blog/${article.id}`}
                            className="group relative block bg-neutral-900/30 border border-white/5 rounded-2xl p-6 md:p-8 hover:bg-neutral-900/50 hover:border-white/10 transition-all duration-300"
                        >
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                                {/* Thumbnail */}
                                <div className="w-full md:w-48 h-48 md:h-32 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/5">
                                    <img
                                        src={article.thumbnail || '/logo.png'}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div className="space-y-3">
                                            {/* Metadata Row */}
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-mono uppercase tracking-widest text-white/50 group-hover:text-white/70 transition-colors">
                                                    {article.type}
                                                </span>
                                                <span className="text-[10px] font-mono text-white/30">{article.date}</span>
                                            </div>

                                            <h2 className="text-2xl font-bold text-white group-hover:underline decoration-white/30 underline-offset-4 decoration-1 transition-all">
                                                {article.title}
                                            </h2>
                                        </div>

                                        {/* Arrow Icon */}
                                        <div className="hidden md:block text-white/10 group-hover:text-white transition-colors duration-300">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                                <polyline points="7 7 17 7 17 17"></polyline>
                                            </svg>
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/50 leading-relaxed line-clamp-2 max-w-2xl font-light">
                                        {article.excerpt}
                                    </p>

                                    {/* Mobile Arrow (bottom) */}
                                    <div className="mt-4 md:hidden text-white/20 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                                        Read <span className="text-lg">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
