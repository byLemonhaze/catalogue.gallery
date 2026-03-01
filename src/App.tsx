import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ArtistCarousel } from './components/ArtistCarousel';
import { LegalModal } from './components/LegalModal';
import { GlobalSearch } from './components/GlobalSearch';
import type { Artist } from './hooks/useArtists';

// Lazy-loaded routes — only fetched when the user navigates to them
const ArtistList = lazy(() => import('./components/ArtistList').then(m => ({ default: m.ArtistList })));
const ArticleView = lazy(() => import('./components/ArticleView').then(m => ({ default: m.ArticleView })));
const ArticleList = lazy(() => import('./components/ArticleList').then(m => ({ default: m.ArticleList })));
const InfoHub = lazy(() => import('./components/InfoHub').then(m => ({ default: m.InfoHub })));
const ArtistFrame = lazy(() => import('./pages/ArtistFrame').then(m => ({ default: m.ArtistFrame })));
const SubmitArtist = lazy(() => import('./pages/SubmitArtist').then(m => ({ default: m.SubmitArtist })));
const Build = lazy(() => import('./pages/Build').then(m => ({ default: m.Build })));

interface HomeProps {
  artists: Artist[];
  loading: boolean;
  artistsError?: string | null;
  isLegalModalOpen: boolean;
  setIsLegalModalOpen: (open: boolean) => void;
}
function Home({ artists, loading, artistsError, setIsLegalModalOpen }: HomeProps) {
  // Restore carousel position from location state (exit navigation) or sessionStorage
  const location = useLocation();
  const [glowColor, setGlowColor] = useState('20, 20, 20');
  const [carouselIndex, setCarouselIndex] = useState(() => {
    const state = location.state as { returnFromUniverse?: boolean; slideIndex?: number } | null;
    if (state?.returnFromUniverse && typeof state.slideIndex === 'number') {
      return state.slideIndex;
    }
    const saved = sessionStorage.getItem('carouselIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showSocialMenu, setShowSocialMenu] = useState(false);

  return (
    <div className="fixed inset-0 w-screen overflow-hidden h-screen h-[100dvh]">
      <Helmet>
        <title>CATALOGUE</title>
      </Helmet>
      {/* Background Ambience — reactive color bleed from active artist */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#050505] to-black pointer-events-none" />
      <div
        className="fixed pointer-events-none"
        style={{
          top: 0, left: '50%',
          width: '900px', height: '700px',
          transform: 'translateX(-50%) translateY(-42%)',
          backgroundColor: `rgb(${glowColor})`,
          filter: 'blur(160px)',
          opacity: 0.14,
          transition: 'background-color 2s ease',
          borderRadius: '50%',
        }}
      />

      {/* Main Content */}
      <main className="relative h-full flex flex-col items-center justify-center px-0 md:px-6 max-w-7xl mx-auto pt-0 pb-0 md:pt-36">

        {/* Carousel Container */}
        {/* Mobile: Flex-1 to push it to center vertically. Desktop: Normal flow. */}
        <div className="w-full flex items-start justify-center md:flex-none md:h-auto md:items-center overflow-hidden">
          {loading ? (
            <div className="w-full h-[450px] md:h-[560px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <div className="text-white/50 text-xs font-mono tracking-[0.3em] uppercase">Loading artists...</div>
              </div>
            </div>
          ) : artists.length === 0 ? (
            <div className="w-full h-[450px] md:h-[560px] flex items-center justify-center px-6">
              <div className="max-w-sm text-center">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em]">Unable to load artists</p>
                <p className="mt-3 text-white/40 text-xs leading-relaxed">
                  {artistsError || 'Could not reach Sanity right now.'}
                </p>
                <p className="mt-2 text-white/30 text-[11px] leading-relaxed">
                  If testing from phone on local dev, add your local origin to Sanity CORS (example: {window.location.origin}).
                </p>
              </div>
            </div>
          ) : (
            <ArtistCarousel
              artists={artists}
              initialIndex={carouselIndex}
              onIndexChange={(index) => {
                setCarouselIndex(index);
                sessionStorage.setItem('carouselIndex', index.toString());
              }}
              onGlowColor={setGlowColor}
            />
          )}
        </div>


      </main>

      {/* Footer - Fixed at bottom */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center text-[11px] text-white/25 font-display tracking-[0.2em] uppercase pointer-events-none">
        CATALOGUE © 2026
      </footer>

      {/* Floating Social Link */}
      {/* Floating Socials */}
      <div className="fixed bottom-5 right-6 z-50 flex flex-col items-end gap-1.5">
        {/* Desktop: Stacked Links */}
        <div className="hidden md:flex flex-col items-end gap-1">
          <a
            href="https://x.com/CatalogueART"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-white/45 hover:text-white transition-colors duration-300 uppercase tracking-[0.12em]"
          >
            @CATALOGUEART - X
          </a>
          <button
            onClick={() => setIsLegalModalOpen(true)}
            className="text-[10px] font-display text-white/35 hover:text-white transition-colors duration-300 uppercase tracking-[0.18em] mt-1"
          >
            Catalogue Policy
          </button>
        </div>

        {/* Mobile: Toggle Menu */}
        <div className="md:hidden relative">
          {showSocialMenu && (
            <>
              {/* Backdrop to close */}
              <div
                className="fixed inset-0 z-40 bg-black/70"
                onClick={() => setShowSocialMenu(false)}
              />

              {/* Menu */}
              <div className="absolute bottom-full right-0 mb-4 flex flex-col items-end gap-4 bg-[#0d0d0d] p-6 border border-white/10 shadow-2xl min-w-[140px] z-50 animate-fade-in origin-bottom-right">
                <a
                  href="https://x.com/CatalogueART"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-widest flex items-center gap-2"
                >
                  Twitter ↗
                </a>
                <div className="w-full h-px bg-white/10" />
                <button
                  onClick={() => {
                    setIsLegalModalOpen(true);
                    setShowSocialMenu(false);
                  }}
                  className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-widest flex items-center gap-2"
                >
                  Policy ↗
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setShowSocialMenu(!showSocialMenu)}
            className={`text-[10px] font-bold transition-colors duration-300 uppercase tracking-widest p-2 -mr-2 relative z-50 ${showSocialMenu ? 'text-white' : 'text-white/20 hover:text-white'}`}
          >
            @
          </button>
        </div>
      </div>
    </div>
  );
}

// Internal Artist Page routes removed


import { useArtists } from './hooks/useArtists';
import { useArticles } from './hooks/useArticles';

const AppContent = () => {
  const location = useLocation();
  const isArtistPage = location.pathname.startsWith('/artist/') || location.pathname.startsWith('/gallery/');

  const { artists, loading, error: artistsError } = useArtists();
  const { articles, loading: articlesLoading } = useArticles();
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isArtistPage) setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isArtistPage]);

  // Randomized artists — memoized so the order is stable across re-renders
  const randomizedArtists = useMemo(() => {
    if (loading) return artists;
    const arr = [...artists];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [artists, loading]);

  const filteredArtists = randomizedArtists.filter(artist =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(search.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-display selection:bg-white/20">
      <Navigation onSearchOpen={() => setIsSearchOpen(true)} />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      <GlobalSearch
        search={search}
        setSearch={setSearch}
        filteredArtists={filteredArtists}
        filteredArticles={filteredArticles}
        isOpen={isSearchOpen && !isArtistPage}
        onClose={() => setIsSearchOpen(false)}
      />

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              artists={filteredArtists}
              loading={loading}
              artistsError={artistsError}
              isLegalModalOpen={isLegalModalOpen}
              setIsLegalModalOpen={setIsLegalModalOpen}
            />
          }
        />
        <Route path="/artist/:id" element={<ArtistFrame />} />
        <Route path="/gallery/:id" element={<ArtistFrame />} />
        <Route path="/submit" element={<SubmitArtist />} />

        <Route path="/blog" element={<ArticleList filter="all" articles={articles} loading={articlesLoading} />} />
        <Route path="/blog/:id" element={<ArticleView articles={articles} loading={articlesLoading} />} />

        <Route path="/artists" element={<ArtistList />} />
        <Route path="/build" element={<Build />} />
        <Route path="/info" element={<InfoHub setIsLegalModalOpen={setIsLegalModalOpen} />} />
      </Routes>
      </Suspense>
    </div>
  );
};

import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
