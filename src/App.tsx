import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useArtists } from './hooks/useArtists';
import { useArticles } from './hooks/useArticles';
import { Navigation } from './components/Navigation';
import { LegalModal } from './components/LegalModal';
import { GlobalSearch } from './components/GlobalSearch';
import { ScrollToTop } from './components/ScrollToTop';
import { SquareLoader } from './components/SquareLoader';
import { type HomeSectionKey } from './constants/homeSections';
import { HomeExperience } from './pages/HomeExperience';

// Lazy-loaded routes — only fetched when the user navigates to them
const ArtistList = lazy(() => import('./components/ArtistList').then(m => ({ default: m.ArtistList })));
const ArticleView = lazy(() => import('./components/ArticleView').then(m => ({ default: m.ArticleView })));
const ArticleList = lazy(() => import('./components/ArticleList').then(m => ({ default: m.ArticleList })));
const InfoHub = lazy(() => import('./components/InfoHub').then(m => ({ default: m.InfoHub })));
const ArtistFrame = lazy(() => import('./pages/ArtistFrame').then(m => ({ default: m.ArtistFrame })));
const SubmitArtist = lazy(() => import('./pages/SubmitArtist').then(m => ({ default: m.SubmitArtist })));
const ContentLab = lazy(() => import('./pages/ContentLab').then(m => ({ default: m.ContentLab })));

function shuffleArray<T>(items: T[]) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

const AppContent = () => {
  const location = useLocation();
  const isArtistPage = location.pathname.startsWith('/artist/') || location.pathname.startsWith('/gallery/');

  const { artists, loading, error: artistsError } = useArtists();
  const { articles, loading: articlesLoading } = useArticles();
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [homeSection, setHomeSection] = useState<HomeSectionKey>('hero');

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

  // Randomized once per artist payload so refreshes feel alive without reshuffling on each render.
  const randomizedArtists = useMemo(() => {
    if (loading) return artists;
    return shuffleArray(artists);
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
      <Navigation
        onSearchOpen={() => setIsSearchOpen(true)}
        activeHomeSection={location.pathname === '/' ? homeSection : undefined}
      />

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
          <SquareLoader className="w-6 h-6" label="Loading page" strokeWidth={1.6} />
        </div>
      }>
        <Routes>
          <Route
            path="/"
            element={
              <HomeExperience
                artists={randomizedArtists}
                loading={loading}
                artistsError={artistsError}
                articles={articles}
                articlesLoading={articlesLoading}
                setIsLegalModalOpen={setIsLegalModalOpen}
                onSectionChange={setHomeSection}
              />
            }
          />
          <Route path="/artist/:id" element={<ArtistFrame />} />
          <Route path="/gallery/:id" element={<ArtistFrame />} />
          <Route path="/submit" element={<SubmitArtist />} />

          <Route path="/blog" element={<ArticleList filter="all" articles={articles} loading={articlesLoading} />} />
          <Route path="/blog/:id" element={<ArticleView articles={articles} loading={articlesLoading} />} />

          <Route path="/artists" element={<ArtistList />} />
          <Route path="/content-lab" element={<ContentLab />} />
          <Route path="/content-lab/admin" element={<Navigate to="/content-lab" replace />} />
          <Route path="/info" element={<InfoHub setIsLegalModalOpen={setIsLegalModalOpen} />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
