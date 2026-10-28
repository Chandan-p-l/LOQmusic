import { Play, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChartTable } from '@/components/loq/ChartTable';
import { SectionHead } from '@/components/loq/ui';
import { Vinyl } from '@/components/loq/Vinyl';
import { hrefFor } from '@/components/music/links';
import { playList, playTrack, shuffleList } from '@/components/music/play';
import { Shelves, TrackShelf } from '@/components/music/ShelfView';
import { LoadError, LoadMoreError } from '@/components/music/States';
import { SkeletonBlock } from '@/components/Skeleton';
import { fetchPlaylist } from '@/data/music/api';
import { useHome } from '@/data/music/queries';
import type { MusicItem, Track } from '@/data/music/types';
import { Artwork } from '@/components/music/Artwork';
import { useQuery } from '@tanstack/react-query';
import { greeting, useLibrary } from '@/state/library';
import { usePlayer } from '@/state/player';
import { HomeSkeleton } from '@/skeletons/PageSkeletons';
import { ShelfSkeleton } from '@/skeletons/ShelfSkeleton';

/** YouTube Music's "Top 100 Songs Global" chart playlist. */
export const GLOBAL_CHART = 'VLPL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i';

export function useChart(id = GLOBAL_CHART) {
  return useQuery({
    queryKey: ['music', 'chart', id],
    queryFn: async () => (await fetchPlaylist(id)).page,
    staleTime: 30 * 60_000,
  });
}

/** The hero: one featured list at a time, its art floating in the gradient, Play and View. */
function TrendingHero({ items }: { items: MusicItem[] }) {
  const [at, setAt] = useState(0);
  const navigate = useNavigate();
  const item = items[at % items.length];
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setAt((n) => n + 1), 7000);
    return () => clearInterval(id);
  }, [items.length]);
  if (!item) return null;
  const href = hrefFor(item);

  return (
    <section className="mx-(--body-gutter) mt-2">
      <SectionHead over="Top" title="Trending" to="/discover" className="!mx-0" />
      <div className="relative overflow-hidden rounded-[32px] border border-[#ffffff1f] shadow-[0_30px_70px_#0009]">
        {/* The reference's gradient bloom, in the accent. */}
        <div className="absolute inset-0 bg-[#120d1d]" />
        <div className="absolute -top-1/3 left-1/4 h-[160%] w-[90%] rotate-[-12deg] rounded-[45%] bg-[radial-gradient(closest-side,var(--accent-2),transparent)] opacity-80 blur-[30px]" />
        <div className="absolute top-0 -right-10 h-full w-[60%] rounded-[40%] bg-[radial-gradient(closest-side,var(--accent-1),transparent)] opacity-80 blur-[40px]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <div className="relative grid min-h-[300px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 p-10 max-md:grid-cols-1 max-md:p-6">
          <div key={item.id} className="animate-rise">
            <p className="type-[600_14px/18px] text-secondary capitalize">{item.kind === 'unknown' ? 'Featured' : item.kind}</p>
            <h1 className="mt-2 line-clamp-3 max-w-[560px] type-[800_46px/50px] tracking-[-0.03em] [text-shadow:0_4px_24px_#0006] max-lg:type-[800_36px/40px] max-md:type-[800_30px/34px]">
              {item.title}
            </h1>
            {item.subtitle && <p className="mt-2 line-clamp-1 type-[500_14px/20px] text-secondary">{item.subtitle}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                className="btn-3d-light h-12 gap-2 rounded-full px-6 type-[700_15px/20px]"
                onClick={() => (href ? navigate(href) : playTrack(item))}
              >
                <Play size={16} fill="currentColor" /> {href ? 'Open' : 'Play'}
              </button>
              {href && (
                <button className="btn-3d h-12 rounded-full !px-6 type-[700_15px/20px]" onClick={() => navigate(href)}>
                  View {item.kind === 'album' ? 'Album' : item.kind === 'artist' ? 'Artist' : 'Playlist'}
                </button>
              )}
            </div>
          </div>
          {/* The cover, as a record half out of its sleeve. */}
          <div className="relative mr-16 h-[220px] w-[220px] animate-float max-lg:hidden">
            <div className="absolute top-2 left-[90px]">
              <Vinyl artwork={item.thumbnail} size={210} playing />
            </div>
            <div className="relative size-[220px] shadow-[0_24px_50px_#000b] [&_img]:object-cover">
              <Artwork src={item.thumbnail} displayWidth={220} radius="24px" />
            </div>
          </div>
        </div>
        {items.length > 1 && (
          <div className="absolute right-6 bottom-4 flex max-md:right-4 max-md:bottom-3">
            {items.map((it, i) => (
              // A 24px target around the small dot, so fingers can hit it.
              <button
                key={it.id}
                className="group/dot grid h-6 min-w-6 place-items-center px-[3px]"
                aria-label={`Show ${it.title}`}
                aria-current={i === at % items.length}
                onClick={() => setAt(i)}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#fff6] transition-all group-aria-current/dot:w-6 group-aria-current/dot:bg-white" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TopChart() {
  const chart = useChart();
  const navigate = useNavigate();
  const tracks = chart.data?.tracks.slice(0, 10) ?? [];
  const source = { title: 'Global Top 50', type: 'playlist' as const, id: GLOBAL_CHART };
  if (chart.isError) return null;
  return (
    <section className="mt-12">
      <SectionHead
        over="Global"
        title="Top 50"
        to={`/playlist/${GLOBAL_CHART}`}
        action={
          chart.data && (
            <div className="ml-auto flex gap-2 pb-0.5">
              <button className="btn-3d size-9 rounded-full" aria-label="Shuffle the chart" onClick={() => shuffleList(chart.data!.tracks.slice(0, 50), { source })}>
                <Shuffle size={15} />
              </button>
              <button className="btn-3d-key size-9 rounded-full" aria-label="Play the chart" onClick={() => playList(chart.data!.tracks.slice(0, 50), 0, { source })}>
                <Play size={15} fill="currentColor" />
              </button>
            </div>
          )
        }
      />
      {chart.data ? (
        <ChartTable tracks={tracks} source={source} />
      ) : (
        <div className="mx-(--body-gutter) flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonBlock key={i} height={60} radius="16px" />
          ))}
        </div>
      )}
      {chart.data && (
        <div className="mx-(--body-gutter) mt-3 flex justify-center">
          <button className="btn-3d h-10 rounded-full !px-5 type-[600_13px/16px]" onClick={() => navigate(`/playlist/${GLOBAL_CHART}`)}>
            See the full chart
          </button>
        </div>
      )}
    </section>
  );
}

/** Songs played here lately, newest first, once each. */
function useRecent(): Track[] {
  const history = useLibrary((s) => s.history);
  return useMemo(() => {
    const seen = new Set<string>();
    return history.map((h) => h.track).filter((t) => !seen.has(t.videoId) && seen.add(t.videoId)).slice(0, 20);
  }, [history]);
}

/** Home: the greeting, the trending hero, the global chart, then YouTube Music's feed. */
export default function HomePage() {
  const home = useHome();
  const name = useLibrary((s) => s.profile?.name ?? '');
  const liked = useLibrary((s) => s.liked);
  const recent = useRecent();
  const sentinel = useRef<HTMLDivElement>(null);
  const nothingPlaying = usePlayer((s) => s.nowPlaying === null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !home.hasNextPage || home.isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !home.isFetchingNextPage) void home.fetchNextPage();
      },
      { root: document.getElementById('scrollable-page'), rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [home.hasNextPage, home.isFetchingNextPage, home.isFetchNextPageError, home.fetchNextPage]);

  const shelves = home.data?.pages.flatMap((page) => page.data) ?? [];
  // The hero features lists (albums and playlists) from the feed's first shelves.
  const heroItems = shelves
    .flatMap((s) => s.items)
    .filter((i) => (i.kind === 'playlist' || i.kind === 'album') && i.thumbnail)
    .slice(0, 5);

  return (
    <div className="pt-8 max-sm:pt-4">
      <header className="mx-(--body-gutter) mb-6">
        <p className="type-[600_14px/18px] text-secondary">{greeting()}</p>
        <h1 className="type-[800_34px/40px] tracking-[-0.02em] max-sm:type-[800_28px/34px]">
          {name ? (
            <>
              Hi, <span className="text-gradient">{name}</span>
            </>
          ) : (
            'Welcome to LOQmusic'
          )}
        </h1>
        {nothingPlaying && <p className="mt-1 type-[500_14px/20px] text-tertiary">What are we listening to today?</p>}
      </header>

      {home.isError && !home.data ? (
        <LoadError error={home.error} onRetry={() => void home.refetch()} />
      ) : !home.data ? (
        <>
          <div className="mx-(--body-gutter) mt-12">
            <SkeletonBlock height={300} radius="32px" />
          </div>
          <HomeSkeleton />
        </>
      ) : (
        <>
          <TrendingHero items={heroItems} />
          <TopChart />
          {recent.length > 0 && <TrackShelf title="Jump Back In" to="/library/history" tracks={recent} source={{ title: 'Recently Played', type: 'home' }} />}
          {liked.length > 0 && <TrackShelf title="From Your Likes" to="/library/liked" tracks={liked.slice(0, 20)} source={{ title: 'Liked Songs', type: 'library' }} />}
          <Shelves shelves={shelves} />
          <div ref={sentinel} />
          {home.isFetchingNextPage && <ShelfSkeleton kind="square" />}
          {home.isFetchNextPageError && <LoadMoreError onRetry={() => void home.fetchNextPage()} />}
        </>
      )}
    </div>
  );
}
