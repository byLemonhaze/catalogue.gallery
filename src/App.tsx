import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ArtistCarousel } from './components/ArtistCarousel';
import { ArtistList } from './components/ArtistList';
import { ArticleView } from './components/ArticleView';
import { ArticleList } from './components/ArticleList';
import { InfoHub } from './components/InfoHub';
import { LegalModal } from './components/LegalModal';
import { GlobalSearch } from './components/GlobalSearch';
import { ArtistFrame } from './pages/ArtistFrame';
import { SubmitArtist } from './pages/SubmitArtist';
import { Build } from './pages/Build';
import type { Artist } from './hooks/useArtists';
import { articles } from './data/articles';

interface HomeProps {
  artists: Artist[];
  loading: boolean;
  isLegalModalOpen: boolean;
  setIsLegalModalOpen: (open: boolean) => void;
}
function Home({ artists, loading, setIsLegalModalOpen }: HomeProps) {
  // Restore carousel position from location state (exit navigation) or sessionStorage
  const location = useLocation();
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
    <div className="fixed inset-0 h-screen w-screen overflow-hidden">
      <Helmet>
        <title>CATALOGUE</title>
      </Helmet>
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />

      {/* Main Content */}
      <main className="relative h-full flex flex-col items-center px-0 md:px-6 max-w-7xl mx-auto pt-36 pb-8 md:justify-center md:pt-32 md:pb-0">

        {/* Carousel Container */}
        {/* Mobile: Flex-1 to push it to center vertically. Desktop: Normal flow. */}
        <div className="flex-1 w-full flex items-center justify-center md:flex-none md:h-auto overflow-hidden">
          {loading || artists.length === 0 ? (
            <div className="text-white/50 text-sm font-mono tracking-widest uppercase">Loading...</div>
          ) : (
            <ArtistCarousel
              artists={artists}
              initialIndex={carouselIndex}
              onIndexChange={(index) => {
                setCarouselIndex(index);
                // Persist carousel position to sessionStorage
                sessionStorage.setItem('carouselIndex', index.toString());
              }}
            />
          )}
        </div>
      </main>
// ... (social footer remains)

      {/* Footer - Fixed at bottom */}
      <footer className="fixed bottom-8 left-0 right-0 text-center text-[10px] text-white/15 font-mono tracking-wider pointer-events-none">
        CATALOGUE © 2026 <span className="lowercase">by</span> Lemonhaze
      </footer>

      {/* Floating Social Link */}
      {/* Floating Socials */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-1">
        {/* Desktop: Stacked Links */}
        <div className="hidden md:flex flex-col items-end gap-1">
          <a
            href="https://x.com/CatalogueART"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            @CATALOGUEART - X
          </a>
          <a
            href="https://discord.gg/QHWnyNNB"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            @CATALOGUE - DISCORD
          </a>
          <button
            onClick={() => setIsLegalModalOpen(true)}
            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors duration-300 uppercase tracking-widest mt-1"
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
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowSocialMenu(false)}
              />

              {/* Menu */}
              <div className="absolute bottom-full right-0 mb-4 flex flex-col items-end gap-4 bg-[#111] p-6 rounded-xl border border-white/10 shadow-2xl min-w-[140px] z-50 animate-fade-in origin-bottom-right">
                <a
                  href="https://x.com/CatalogueART"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-white hover:text-purple-400 uppercase tracking-widest flex items-center gap-2"
                >
                  Twitter ↗
                </a>
                <div className="w-full h-px bg-white/10" />
                <a
                  href="https://discord.gg/QHWnyNNB"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-white hover:text-purple-400 uppercase tracking-widest flex items-center gap-2"
                >
                  Discord ↗
                </a>
                <div className="w-full h-px bg-white/10" />
                <button
                  onClick={() => {
                    setIsLegalModalOpen(true);
                    setShowSocialMenu(false);
                  }}
                  className="text-xs font-bold text-white hover:text-purple-400 uppercase tracking-widest flex items-center gap-2"
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

const AppContent = () => {
  const location = useLocation();
  const isSubmitPage = location.pathname === '/submit';
  const isBuildPage = location.pathname === '/build';
  const isArtistPage = location.pathname.startsWith('/artist/') || location.pathname.startsWith('/gallery/');

  const { artists, loading } = useArtists();
  const [search, setSearch] = useState('');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // Randomized artists for the Home page
  const randomizedArtists = [...artists];
  // Fisher-Yates shuffle for all artists (only shuffle when loading is finished)
  if (!loading) {
    for (let i = randomizedArtists.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomizedArtists[i], randomizedArtists[j]] = [randomizedArtists[j], randomizedArtists[i]];
    }
  }

  const filteredArtists = randomizedArtists.filter(artist =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(search.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      <Navigation />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Hide Search on Submit, Build, and Artist pages */}
      {!isSubmitPage && !isBuildPage && !isArtistPage && !isLegalModalOpen && (
        <GlobalSearch
          search={search}
          setSearch={setSearch}
          filteredArtists={filteredArtists}
          filteredArticles={filteredArticles}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              artists={filteredArtists}
              loading={loading}
              isLegalModalOpen={isLegalModalOpen}
              setIsLegalModalOpen={setIsLegalModalOpen}
            />
          }
        />
        <Route path="/artist/:id" element={<ArtistFrame />} />
        <Route path="/gallery/:id" element={<ArtistFrame />} />
        <Route path="/submit" element={<SubmitArtist />} />

        <Route path="/blog" element={<ArticleList filter="all" />} />
        <Route path="/blog/:id" element={<ArticleView />} />

        <Route path="/artists" element={<ArtistList />} />
        <Route path="/build" element={<Build />} />
        <Route path="/info" element={<InfoHub setIsLegalModalOpen={setIsLegalModalOpen} />} />
      </Routes>
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
