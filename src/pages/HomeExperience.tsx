import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ArtistCarousel } from '../components/ArtistCarousel';
import { CatalogueFooterLinks } from '../components/CatalogueFooterLinks';
import { SquareLoader } from '../components/SquareLoader';
import { HOME_SECTION_IDS, type HomeSectionKey } from '../constants/homeSections';
import type { Artist } from '../hooks/useArtists';
import { readHomeMemory, writeHomeMemory } from '../lib/homeMemory';
import { urlFor } from '../sanity/image';
import type { ArticleRecord } from '../types/article';

interface HomeExperienceProps {
  artists: Artist[];
  loading: boolean;
  artistsError?: string | null;
  articles: ArticleRecord[];
  articlesLoading: boolean;
  setIsLegalModalOpen: (open: boolean) => void;
  onSectionChange: (section: HomeSectionKey) => void;
}

interface HomeRouteState {
  returnFromUniverse?: boolean;
  slideIndex?: number;
  homeSection?: HomeSectionKey;
  homeScrollTop?: number;
  directoryPage?: number;
}

interface DirectoryReturnState {
  from: 'directory-section';
  homeSection: 'directory';
  homeScrollTop: number;
  directoryPage: number;
}

function getArtistThumbnailUrl(artist: Artist) {
  if (!artist.thumbnail) return null;
  if (artist.isSanity) return urlFor(artist.thumbnail).width(320).height(400).url();
  return typeof artist.thumbnail === 'string' ? artist.thumbnail : null;
}

function getArticleThumbnailUrl(article: ArticleRecord) {
  return article.thumbnailUrl || '/logo.png';
}

function scrollToSection(section: HomeSectionKey, container: HTMLDivElement | null, behavior: ScrollBehavior = 'smooth') {
  const target = document.getElementById(HOME_SECTION_IDS[section]);
  if (!target || !container) return;
  container.scrollTo({ top: target.offsetTop, behavior });
}

function isPlainLeftClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey;
}

function PreviewArtistCard({
  artist,
  getReturnState,
}: {
  artist: Artist;
  getReturnState: () => DirectoryReturnState;
}) {
  const navigate = useNavigate();
  const href = artist.type === 'gallery' || artist.type === 'collection'
    ? `/gallery/${artist.id}`
    : `/artist/${artist.id}`;
  const thumbnailUrl = getArtistThumbnailUrl(artist);

  return (
    <Link
      to={href}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
        navigate(href, { state: getReturnState() });
      }}
      className="group relative cursor-pointer overflow-hidden border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/25"
    >
      <div className="aspect-[4/5] overflow-hidden bg-white/5">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={artist.name}
            className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5">
            <span className="text-5xl font-bold text-white/20 uppercase">{artist.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
        <p className="text-sm font-bold tracking-tight text-white">{artist.name}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">{artist.subtitle}</p>
      </div>
    </Link>
  );
}

function PreviewArticleCard({ article }: { article: ArticleRecord }) {
  return (
    <Link
      to={`/blog/${article.id}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/25"
    >
      <div className="aspect-[16/10] overflow-hidden bg-white/5">
        <img
          src={getArticleThumbnailUrl(article)}
          alt=""
          className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
        />
      </div>
      <div className="flex h-full flex-col justify-between p-5">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">
              {article.type}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/20">{article.date}</span>
          </div>
          <h3 className="max-w-sm text-lg font-bold leading-snug tracking-tight text-white transition-colors duration-300 group-hover:text-white/80">
            {article.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
            {article.excerpt}
          </p>
        </div>
        <span className="mt-8 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35 transition-colors duration-300 group-hover:text-white">
          Read entry
        </span>
      </div>
    </Link>
  );
}

function FeaturedArticleCard({ article }: { article: ArticleRecord }) {
  return (
    <Link
      to={`/blog/${article.id}`}
      className="group relative cursor-pointer overflow-hidden border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/25"
    >
      <div className="absolute inset-0">
        <img
          src={getArticleThumbnailUrl(article)}
          alt=""
          className="h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-60"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/78 to-black/20" />
      <div className="relative flex min-h-[360px] flex-col justify-end p-6 md:min-h-[420px] md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">
            {article.type}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/20">{article.date}</span>
        </div>
        <h3 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-white/80 md:text-3xl">
          {article.title}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
          {article.excerpt}
        </p>
        <span className="mt-8 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45 transition-colors duration-300 group-hover:text-white">
          Read feature
        </span>
      </div>
    </Link>
  );
}

export function HomeExperience({
  artists,
  loading,
  artistsError,
  articles,
  articlesLoading,
  setIsLegalModalOpen,
  onSectionChange,
}: HomeExperienceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const routeState = (location.state as HomeRouteState | null) ?? null;
  const [glowColor, setGlowColor] = useState('20, 20, 20');
  const [directoryGridPage, setDirectoryGridPage] = useState(() => routeState?.directoryPage ?? 0);
  const [carouselIndex, setCarouselIndex] = useState(() => {
    if (routeState?.returnFromUniverse && typeof routeState.slideIndex === 'number') {
      return routeState.slideIndex;
    }
    const saved = sessionStorage.getItem('carouselIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const artistEntries = useMemo(
    () => artists.filter((artist) => !artist.type || artist.type === 'artist'),
    [artists],
  );
  const galleryEntries = useMemo(
    () => artists.filter((artist) => artist.type === 'gallery' || artist.type === 'collection').slice(0, 4),
    [artists],
  );
  const featuredArticles = useMemo(() => articles.slice(0, 3), [articles]);
  const directoryPageCount = Math.max(1, Math.ceil(artistEntries.length / 6));
  const normalizedDirectoryPage = directoryGridPage % directoryPageCount;
  const visibleDirectoryArtists = artistEntries.slice(normalizedDirectoryPage * 6, normalizedDirectoryPage * 6 + 6);
  const shouldRestoreStoredHomeMemory = !routeState && navigationType === 'POP' && location.key !== 'default';
  const storedHomeMemory = shouldRestoreStoredHomeMemory ? readHomeMemory() : null;
  const requestedSection = routeState?.homeSection ?? storedHomeMemory?.homeSection;
  const requestedScrollTop = routeState?.homeScrollTop ?? storedHomeMemory?.homeScrollTop;
  const activeSectionRef = useRef<HomeSectionKey>(requestedSection ?? 'hero');

  const createDirectoryReturnState = () => ({
    from: 'directory-section' as const,
    homeSection: 'directory' as const,
    homeScrollTop: scrollRef.current?.scrollTop ?? 0,
    directoryPage: normalizedDirectoryPage,
  });

  useLayoutEffect(() => {
    if (!requestedSection && typeof requestedScrollTop !== 'number') return;

    if (typeof requestedScrollTop === 'number' && scrollRef.current) {
      scrollRef.current.scrollTop = requestedScrollTop;
      const restoredSection = requestedSection || 'directory';
      activeSectionRef.current = restoredSection;
      onSectionChange(restoredSection);
    } else if (requestedSection) {
      scrollToSection(requestedSection, scrollRef.current, 'auto');
      activeSectionRef.current = requestedSection;
      onSectionChange(requestedSection);
    }

    if (location.state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate, onSectionChange, requestedScrollTop, requestedSection]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame = 0;
    const sections: HomeSectionKey[] = ['hero', 'directory', 'lab', 'apply'];
    const updateActiveSection = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      const probeY = scrollTop + viewportHeight * 0.38;
      let activeSection: HomeSectionKey = 'hero';
      let bestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const element = document.getElementById(HOME_SECTION_IDS[section]);
        if (!element) return;

        const sectionTop = element.offsetTop;
        const sectionBottom = sectionTop + element.offsetHeight;
        if (probeY >= sectionTop && probeY < sectionBottom) {
          activeSection = section;
          bestDistance = -1;
          return;
        }

        if (bestDistance !== -1) {
          const distance = Math.abs(sectionTop + element.offsetHeight / 2 - probeY);
          if (distance < bestDistance) {
            bestDistance = distance;
            activeSection = section;
          }
        }
      });

      activeSectionRef.current = activeSection;
      onSectionChange(activeSection);
      writeHomeMemory({
        homeSection: activeSection,
        homeScrollTop: container.scrollTop,
        directoryPage: normalizedDirectoryPage,
      });
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveSection();
      });
    };

    container.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();

    return () => {
      container.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [normalizedDirectoryPage, onSectionChange]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    writeHomeMemory({
      homeSection: activeSectionRef.current,
      homeScrollTop: container.scrollTop,
      directoryPage: normalizedDirectoryPage,
    });
  }, [normalizedDirectoryPage]);

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <Helmet>
        <title>CATALOGUE</title>
      </Helmet>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.07),transparent_30%),radial-gradient(circle_at_84%_6%,rgba(255,255,255,0.04),transparent_24%),linear-gradient(180deg,#040404,#000)]" />
      <div
        className="pointer-events-none fixed"
        style={{
          top: 0,
          left: '50%',
          width: '920px',
          height: '720px',
          transform: 'translateX(-50%) translateY(-42%)',
          backgroundColor: `rgb(${glowColor})`,
          filter: 'blur(170px)',
          opacity: 0.14,
          transition: 'background-color 2s ease',
          borderRadius: '50%',
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.3)_100%)]" />

      <div
        ref={scrollRef}
        className="relative h-full overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        <section
          id={HOME_SECTION_IDS.hero}
          className="relative flex min-h-[100dvh] items-center px-0 pb-12 pt-24 md:px-6 md:pb-8"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
            {loading ? (
              <div className="flex h-[400px] w-full items-center justify-center md:h-[520px]">
                <SquareLoader className="h-8 w-8" label="Loading artists" strokeWidth={1.8} drift />
              </div>
            ) : artists.length === 0 ? (
              <div className="flex h-[400px] w-full items-center justify-center px-6 md:h-[520px]">
                <div className="max-w-sm text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Unable to load artists</p>
                  <p className="mt-3 text-xs leading-relaxed text-white/40">
                    {artistsError || 'Could not reach Sanity right now.'}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/30">
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

            {!loading && artists.length > 0 && (
              <div className="mt-5 flex max-w-xl flex-col items-center gap-3 px-6 text-center md:mt-7">
                <span className="select-none font-mono text-[11px] tracking-[0.15em] text-white/35">
                  {String(carouselIndex + 1).padStart(2, '0')} / {String(artists.length).padStart(2, '0')}
                </span>
                <p className="max-w-md text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
                  <span className="block">A directory of digital artists</span>
                  <span className="mt-1 block">unfiltered, self-curated, independent</span>
                </p>
                <Link
                  to="/info"
                  className="border-b border-white/15 pb-px text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 transition-colors duration-300 hover:border-white/50 hover:text-white"
                >
                  Apply to Catalogue →
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection('directory', scrollRef.current)}
                  className="mt-4 inline-flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/30 transition-colors duration-300 hover:text-white/70"
                >
                  <span>Explore</span>
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <section
          id={HOME_SECTION_IDS.directory}
          className="relative flex min-h-[100dvh] items-center px-6 py-24 md:py-28"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col justify-center gap-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/25">Directory</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-black uppercase tracking-[0.04em] text-white md:text-5xl">
                  Artist-owned websites first. Marketplaces second.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-pretty text-white/50 md:text-base">
                  CATALOGUE helps collectors discover new artists without flattening them into a single marketplace. Instead of hosting the work, it sends people directly into each artist&apos;s own website and self-curated world.
                </p>
              </div>
              <div className="grid min-w-[240px] grid-cols-2 gap-px border border-white/10 bg-white/10 text-center">
                <div className="bg-black/70 px-5 py-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/25">Artist Universes</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">{artists.filter((artist) => !artist.type || artist.type === 'artist').length}</p>
                </div>
                <div className="bg-black/70 px-5 py-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/25">Curated Spaces</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">{artists.filter((artist) => artist.type === 'gallery' || artist.type === 'collection').length}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center border border-white/10 bg-white/[0.03]">
                <SquareLoader className="h-7 w-7" label="Loading directory preview" strokeWidth={1.6} drift />
              </div>
            ) : artists.length === 0 ? (
              <div className="border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-white/45">Directory preview unavailable</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/40">
                  {artistsError || 'The public directory feed is not available right now.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                <div>
                  <div className="mb-4 flex items-center justify-end gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/25">
                      Artists
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/25">
                        {String(normalizedDirectoryPage + 1).padStart(2, '0')} / {String(directoryPageCount).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDirectoryGridPage((current) => (current - 1 + directoryPageCount) % directoryPageCount)}
                        className="group inline-flex cursor-pointer appearance-none items-center bg-transparent p-0 rounded-none border-0 text-white/35 transition-colors duration-300 hover:text-white"
                        aria-label="Previous artist grid"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        <span className="ml-2 h-px w-8 bg-current opacity-25 transition-opacity duration-300 group-hover:opacity-70" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirectoryGridPage((current) => (current + 1) % directoryPageCount)}
                        className="group inline-flex cursor-pointer appearance-none items-center bg-transparent p-0 rounded-none border-0 text-white/35 transition-colors duration-300 hover:text-white"
                        aria-label="Next artist grid"
                      >
                        <span className="mr-2 h-px w-8 bg-current opacity-25 transition-opacity duration-300 group-hover:opacity-70" />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleDirectoryArtists.map((artist) => (
                    <PreviewArtistCard key={artist.id} artist={artist} getReturnState={createDirectoryReturnState} />
                  ))}
                  </div>
                </div>

                <div className="border border-white/10 bg-white/[0.03] p-5 md:p-6">
                  <div className="border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/25">Galleries + Platforms</p>
                      <p className="mt-2 text-lg font-bold tracking-tight text-white">Galleries and curated spaces</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-white/45">
                    The directory also includes galleries, platforms, and other spaces that shape discovery around the artists.
                  </p>

                  <div className="mt-6 space-y-4">
                    {galleryEntries.map((gallery) => (
                      <Link
                        key={gallery.id}
                        to={`/gallery/${gallery.id}`}
                        onClick={(event) => {
                          if (!isPlainLeftClick(event)) return;
                          event.preventDefault();
                          navigate(`/gallery/${gallery.id}`, { state: createDirectoryReturnState() });
                        }}
                        className="group flex items-start gap-4 border-b border-white/8 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="mt-0.5 h-12 w-12 shrink-0 overflow-hidden bg-white/5">
                          {getArtistThumbnailUrl(gallery) ? (
                            <img
                              src={getArtistThumbnailUrl(gallery) || ''}
                              alt={gallery.name}
                              className="h-full w-full object-cover opacity-75 transition duration-300 group-hover:opacity-100"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="text-lg font-bold uppercase text-white/20">{gallery.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-white/80">
                            {gallery.name}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-white/40">{gallery.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="flex justify-start md:justify-center">
                    <Link
                      to="/artists"
                      className="inline-flex items-center justify-center border border-white/18 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-white/45 hover:bg-white/5"
                    >
                      Browse Artists + Galleries
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          id={HOME_SECTION_IDS.lab}
          className="relative flex min-h-[92dvh] items-center px-6 py-24 md:py-28"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col justify-center gap-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/25">Content Lab</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-black uppercase tracking-[0.04em] text-white md:text-5xl">
                  The writing layer around Catalogue
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/50 md:text-base">
                  The directory is only one half of the presence. The other half is editorial: profiles, interviews, criticism, and scene-writing that gives shape and memory to the field around digital art.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/content-lab"
                  className="inline-flex items-center justify-center border border-white/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-white/45 hover:bg-white/5"
                >
                  Open Content Lab
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center justify-center border border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors duration-300 hover:border-white/35 hover:text-white"
                >
                  Browse Archive
                </Link>
              </div>
            </div>

            {articlesLoading && featuredArticles.length === 0 ? (
              <div className="flex h-48 items-center justify-center border border-white/10 bg-white/[0.03]">
                <SquareLoader className="h-7 w-7" label="Loading content preview" strokeWidth={1.6} drift />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                {featuredArticles[0] && <FeaturedArticleCard article={featuredArticles[0]} />}
                <div className="grid gap-4">
                  {featuredArticles.slice(1).map((article) => (
                    <PreviewArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          id={HOME_SECTION_IDS.apply}
          className="relative flex min-h-[90dvh] items-center px-6 py-24 md:py-28"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/25">Apply + About</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black uppercase tracking-[0.04em] text-white md:text-5xl">
                If the work has its own universe, it belongs here.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/50 md:text-base">
                CATALOGUE is built for artists and galleries who want their presence represented on their own terms: direct links to personal sites, better context, and less dependence on flattened marketplace frames.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Artists</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    Lead with your own website, your own context, and your own presentation.
                  </p>
                </div>
                <div className="border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Galleries</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    Present coherent curatorial ecosystems alongside individual artistic practices.
                  </p>
                </div>
                <div className="border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Collectors</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    Discover digital art through artists' worlds rather than through marketplace listings alone.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.03] p-6 md:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/25">Next Step</p>
              <p className="mt-4 max-w-sm text-2xl font-black uppercase tracking-[0.04em] text-white">
                Submit a profile & learn more about Catalogue.
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
                Applications are reviewed before publication. Artists should have their own website, and galleries should present a clear curatorial context.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/info"
                  className="inline-flex items-center justify-center border border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors duration-300 hover:border-white/35 hover:text-white"
                >
                  About Catalogue
                </Link>
                <Link
                  to="/submit"
                  className="inline-flex items-center justify-center border border-white/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-white/45 hover:bg-white/5"
                >
                  Apply now
                </Link>
              </div>
              <p className="mt-10 text-[10px] uppercase tracking-[0.2em] text-white/15">
                CATALOGUE © 2026
              </p>
            </div>
          </div>
        </section>
      </div>

      <CatalogueFooterLinks
        onOpenPolicy={() => setIsLegalModalOpen(true)}
        variant="home"
        containerClassName="fixed bottom-5 right-6 z-50 flex flex-col items-end gap-1.5"
      />
    </div>
  );
}
