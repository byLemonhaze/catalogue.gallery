import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ContentLabSection, EditorPicksSection } from '../components/ContentLabSection';
import { ArtistCarousel } from '../components/ArtistCarousel';
import { CatalogueFooterLinks } from '../components/CatalogueFooterLinks';
import { SquareLoader } from '../components/SquareLoader';
import { EDITOR_PICKS_SECTION_ID, HOME_SECTION_IDS, type HomeSectionKey } from '../constants/homeSections';
import type { Artist } from '../hooks/useArtists';
import { readHomeMemory, writeHomeMemory } from '../lib/homeMemory';
import { scrollToHomeSection } from '../lib/homeNavigation';
import { urlFor } from '../sanity/image';
import type { ArticleRecord } from '../types/article';
import { useEditorialSelection } from '../hooks/useEditorialSelection';

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
  if (artist.isSanity) {
    const image = urlFor(artist.thumbnail).width(480).height(600).auto('format').quality(80);
    return artist.id === 'harto' ? image.fit('max').url() : image.url();
  }
  return typeof artist.thumbnail === 'string' ? artist.thumbnail : null;
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
    ? `/gallery/${artist.id}/`
    : `/artist/${artist.id}/`;
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
            loading="lazy" decoding="async" width="480" height="600"
            style={{ objectPosition: artist.id === 'harto' ? 'center top' : 'center' }}
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

export function HomeExperience({
  artists,
  loading,
  artistsError,
  articles,
  articlesLoading,
  setIsLegalModalOpen,
  onSectionChange,
}: HomeExperienceProps) {
  const editorialSelection = useEditorialSelection();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const restoredLocationKey = useRef<string | null>(null);
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
  const directoryPageCount = Math.max(1, Math.ceil(artistEntries.length / 6));
  const normalizedDirectoryPage = directoryGridPage % directoryPageCount;
  const visibleDirectoryArtists = useMemo(() => {
    if (artistEntries.length === 0) return [];

    const pageSize = 6;
    const startIndex = normalizedDirectoryPage * pageSize;
    const pageArtists = artistEntries.slice(startIndex, startIndex + pageSize);

    if (pageArtists.length >= pageSize) {
      return pageArtists;
    }

    return [
      ...pageArtists,
      ...artistEntries.slice(0, pageSize - pageArtists.length),
    ];
  }, [artistEntries, normalizedDirectoryPage]);
  const shouldRestoreStoredHomeMemory = !routeState && navigationType === 'POP' && location.key !== 'default';
  const storedHomeMemory = shouldRestoreStoredHomeMemory ? readHomeMemory() : null;
  const requestedSection = routeState?.homeSection ?? storedHomeMemory?.homeSection;
  const requestedScrollTop = routeState?.homeScrollTop ?? storedHomeMemory?.homeScrollTop;
  const activeSectionRef = useRef<HomeSectionKey>(requestedSection ?? 'hero');
  const [directoryGridTransitionPhase, setDirectoryGridTransitionPhase] = useState<'idle' | 'out' | 'pre-in'>('idle');
  const [directoryGridTransitionDirection, setDirectoryGridTransitionDirection] = useState<1 | -1>(1);
  const directoryTransitionTimeoutRef = useRef<number | null>(null);
  const directoryTransitionRafRef = useRef<number | null>(null);
  const directoryTransitioningRef = useRef(false);

  const createDirectoryReturnState = () => ({
    from: 'directory-section' as const,
    homeSection: 'directory' as const,
    homeScrollTop: scrollRef.current?.scrollTop ?? 0,
    directoryPage: normalizedDirectoryPage,
  });

  const transitionDirectoryGridPage = useCallback((getNextPage: (current: number) => number, direction: 1 | -1) => {
    if (directoryPageCount <= 1 || directoryTransitioningRef.current) return;

    directoryTransitioningRef.current = true;
    setDirectoryGridTransitionDirection(direction);
    setDirectoryGridTransitionPhase('out');

    if (directoryTransitionTimeoutRef.current) {
      window.clearTimeout(directoryTransitionTimeoutRef.current);
    }

    if (directoryTransitionRafRef.current) {
      window.cancelAnimationFrame(directoryTransitionRafRef.current);
    }

    directoryTransitionTimeoutRef.current = window.setTimeout(() => {
      setDirectoryGridPage((current: number) => {
        const nextPage = getNextPage(current);
        return ((nextPage % directoryPageCount) + directoryPageCount) % directoryPageCount;
      });

      setDirectoryGridTransitionPhase('pre-in');

      directoryTransitionRafRef.current = window.requestAnimationFrame(() => {
        directoryTransitionRafRef.current = window.requestAnimationFrame(() => {
          setDirectoryGridTransitionPhase('idle');
          directoryTransitioningRef.current = false;
        });
      });
    }, 210);
  }, [directoryPageCount]);

  useLayoutEffect(() => {
    if (!requestedSection && typeof requestedScrollTop !== 'number') return;
    // Wait for section heights, and restore only once per navigation (not on every scroll).
    if (loading || articlesLoading || restoredLocationKey.current === location.key) return;
    restoredLocationKey.current = location.key;

    if (typeof requestedScrollTop === 'number' && scrollRef.current) {
      scrollRef.current.scrollTop = requestedScrollTop;
      const restoredSection = requestedSection || 'directory';
      activeSectionRef.current = restoredSection;
      onSectionChange(restoredSection);
    } else if (requestedSection) {
      scrollToHomeSection(requestedSection, 'instant');
      activeSectionRef.current = requestedSection;
      onSectionChange(requestedSection);
    }

    if (location.state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.key, location.pathname, location.state, loading, articlesLoading, navigate, onSectionChange, requestedScrollTop, requestedSection]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame = 0;
    const sections: { key: HomeSectionKey; id: string }[] = [
      { key: 'hero', id: HOME_SECTION_IDS.hero },
      { key: 'directory', id: HOME_SECTION_IDS.directory },
      { key: 'lab', id: HOME_SECTION_IDS.lab },
      { key: 'lab', id: EDITOR_PICKS_SECTION_ID },
      { key: 'apply', id: HOME_SECTION_IDS.apply },
    ];
    const updateActiveSection = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      const probeY = scrollTop + viewportHeight * 0.38;
      let activeSection: HomeSectionKey = 'hero';
      let bestDistance = Number.POSITIVE_INFINITY;

      sections.forEach(({ key: section, id }) => {
        const element = document.getElementById(id);
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

  useEffect(() => {
    if (directoryPageCount <= 1) return;

    const interval = window.setInterval(() => {
      if (document.hidden || activeSectionRef.current !== 'directory' || directoryTransitioningRef.current) {
        return;
      }

      transitionDirectoryGridPage((current) => current + 1, 1);
    }, 7800);

    return () => window.clearInterval(interval);
  }, [directoryPageCount, transitionDirectoryGridPage]);

  useEffect(() => {
    return () => {
      if (directoryTransitionTimeoutRef.current) {
        window.clearTimeout(directoryTransitionTimeoutRef.current);
      }

      if (directoryTransitionRafRef.current) {
        window.cancelAnimationFrame(directoryTransitionRafRef.current);
      }
    };
  }, []);

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
        id="home-scroll-container"
        ref={scrollRef}
        className="relative h-full overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        <section
          id={HOME_SECTION_IDS.hero}
          className="relative flex min-h-[100svh] md:min-h-[100dvh] items-center px-0 pb-12 pt-24 md:px-6 md:pb-8"
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
                  Apply to Catalogue
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToHomeSection('directory')}
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
          className="relative flex items-center px-6 py-16 md:py-24"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col justify-center gap-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl" data-home-scroll-anchor="true">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/25">Directory</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl">
                  Discover the artists. Enter their worlds.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-pretty text-white/50 md:text-base">
                  Explore independent practices through the artists’ own websites. Follow your curiosity, discover a new perspective, and see the work as its maker intended.
                </p>
              </div>
              <div className="flex min-w-[240px] flex-col gap-3">
                <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 text-center">
                  <div className="bg-black/70 px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/25">Artist Universes</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white">{artists.filter((artist) => !artist.type || artist.type === 'artist').length}</p>
                  </div>
                  <div className="bg-black/70 px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/25">Curated Spaces</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white">{artists.filter((artist) => artist.type === 'gallery' || artist.type === 'collection').length}</p>
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <Link
                    to="/artists"
                    className="inline-flex items-center justify-center border border-white/18 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-white/45 hover:bg-white/5"
                  >
                    Browse Artists + Galleries
                  </Link>
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
                  <div className="mb-4 flex items-center justify-center md:justify-end">
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.16em] text-white/25">
                      <button
                        type="button"
                        onClick={() => transitionDirectoryGridPage((current: number) => current - 1, -1)}
                        className="inline-flex cursor-pointer appearance-none items-center bg-transparent p-0 text-white/35 outline-none transition-colors duration-300 hover:text-white focus:outline-none focus-visible:text-white"
                        aria-label="Previous artist grid"
                      >
                        &lt;
                      </button>
                      <span aria-hidden="true" className="text-white/18">-</span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/25">
                        Artists {String(normalizedDirectoryPage + 1).padStart(2, '0')} / {String(directoryPageCount).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true" className="text-white/18">-</span>
                      <button
                        type="button"
                        onClick={() => transitionDirectoryGridPage((current: number) => current + 1, 1)}
                        className="inline-flex cursor-pointer appearance-none items-center bg-transparent p-0 text-white/35 outline-none transition-colors duration-300 hover:text-white focus:outline-none focus-visible:text-white"
                        aria-label="Next artist grid"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <div
                      className={`grid grid-cols-2 gap-4 will-change-transform xl:grid-cols-3 ${
                        directoryGridTransitionPhase === 'pre-in'
                          ? ''
                          : 'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
                      } ${
                        directoryGridTransitionPhase === 'out'
                          ? directoryGridTransitionDirection === 1
                            ? '-translate-x-3 opacity-0'
                            : 'translate-x-3 opacity-0'
                          : directoryGridTransitionPhase === 'pre-in'
                            ? directoryGridTransitionDirection === 1
                              ? 'translate-x-3 opacity-0'
                              : '-translate-x-3 opacity-0'
                            : 'translate-x-0 opacity-100'
                      }`}
                    >
                    {visibleDirectoryArtists.map((artist) => (
                      <PreviewArtistCard key={artist.id} artist={artist} getReturnState={createDirectoryReturnState} />
                    ))}
                    </div>
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
                    Meet the galleries and independent spaces bringing artists and audiences together.
                  </p>

                  <div className="mt-6 space-y-4">
                    {galleryEntries.map((gallery) => (
                      <Link
                        key={gallery.id}
                        to={`/gallery/${gallery.id}/`}
                        onClick={(event) => {
                          if (!isPlainLeftClick(event)) return;
                          event.preventDefault();
                          navigate(`/gallery/${gallery.id}/`, { state: createDirectoryReturnState() });
                        }}
                        className="group flex items-start gap-4 border-b border-white/8 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="mt-0.5 h-12 w-12 shrink-0 overflow-hidden bg-white/5">
                          {getArtistThumbnailUrl(gallery) ? (
                            <img
                              src={getArtistThumbnailUrl(gallery) || ''}
                              alt={gallery.name}
                              loading="lazy" decoding="async" width="48" height="48"
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

              </div>
            )}
          </div>
        </section>

        <ContentLabSection articles={articles} loading={articlesLoading} selection={editorialSelection} />

        <EditorPicksSection articles={articles} loading={articlesLoading} selection={editorialSelection} />

        <section
          id={HOME_SECTION_IDS.apply}
          className="relative flex items-center border-t border-white/20 bg-[#080808] px-6 py-16 md:py-24"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div data-home-scroll-anchor="true">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c7c7c7]">Apply + About</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl">
                Your practice. Your perspective. Your place here.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#d1d1d1]">
                CATALOGUE brings together a publication and an independent directory for digital art. We connect readers with artists, their work, and the ideas behind it.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="border border-[#3d3d3d] bg-[#141414] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ededed]">Artists</p>
                  <p className="mt-3 text-[15px] leading-7 text-[#d1d1d1]">
                    Lead with your own website, your own context, and your own presentation.
                  </p>
                </div>
                <div className="border border-[#3d3d3d] bg-[#141414] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ededed]">Galleries</p>
                  <p className="mt-3 text-[15px] leading-7 text-[#d1d1d1]">
                    Introduce the artists, exhibitions, and ideas that shape your programme.
                  </p>
                </div>
                <div className="border border-[#3d3d3d] bg-[#141414] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ededed]">Collectors</p>
                  <p className="mt-3 text-[15px] leading-7 text-[#d1d1d1]">
                    Get to know the work, the artist, and the story behind the practice.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#575757] bg-[#1b1b1b] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7c7c7]">Next Step</p>
              <p className="mt-4 max-w-sm text-2xl font-bold tracking-tight text-white">
                Introduce us to your world.
              </p>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-[#d1d1d1]">
                Have an artist website or a gallery programme to share? Send it our way. Every application is reviewed before it joins the directory.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/submit" className="inline-flex min-h-12 items-center justify-center border border-[#f2f2ef] bg-[#f2f2ef] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] !text-[#111111] transition-colors hover:bg-white">
                  Apply now
                </Link>
                <Link to="/info" className="inline-flex min-h-12 items-center justify-center border border-[#777777] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ededed] transition-colors hover:border-white hover:bg-white/10">
                  About Catalogue
                </Link>
              </div>
              <p className="mt-10 text-xs tracking-[0.12em] text-[#b5b5b5]">
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
