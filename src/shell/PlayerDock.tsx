import { Maximize2, Mic2 } from 'lucide-react';
import { UpNextIcon } from '@/components/icons/Transport';
import { Vinyl } from '@/components/loq/Vinyl';
import { ExplicitBadge } from '@/components/music/ExplicitBadge';
import { FavoriteButton } from '@/components/music/FavoriteButton';
import { TrackMenu } from '@/components/music/TrackMenu';
import { albumHref } from '@/components/music/links';
import { usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { NerdStats } from './NerdStats';
import { Credits, PageLink, pageLink } from './Lcd';
import { albumPageFor } from './nowPlayingLinks';
import { Scrubber, SoundMenu, Transport, useSleepLeft, VolumeSlider } from './controls';

/** The current queue entry, when it is what's playing: menus and likes need the whole track. */
export function useCurrentTrack() {
  return usePlayer((s) => {
    const entry = s.queue[s.index]?.track;
    return entry && entry.videoId === s.nowPlaying?.videoId ? entry : null;
  });
}

/** The now-playing names: the title opens the album, each artist their page. */
export function NowPlayingNames({ big = false }: { big?: boolean }) {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const status = usePlayer((s) => s.status);
  const error = usePlayer((s) => s.error);
  const track = useCurrentTrack();
  if (!nowPlaying) return <p className="type-[600_14px/18px] text-secondary">Nothing playing yet</p>;
  const titleClass = big ? 'type-[800_28px/34px] tracking-[-0.02em] max-md:type-[800_22px/28px]' : 'type-[700_14px/18px]';
  const artistClass = big ? 'type-[500_17px/24px] text-secondary' : 'type-[500_12px/16px] text-secondary';
  return (
    <div className="min-w-0">
      <div className={`flex min-w-0 items-center gap-1 ${titleClass}`}>
        <PageLink
          className={`${pageLink} truncate`}
          href={albumHref(track?.album?.id ?? null)}
          resolve={() => albumPageFor(nowPlaying.videoId, track?.album ?? null, `${nowPlaying.title} ${nowPlaying.artist}`)}
        >
          {nowPlaying.title}
        </PageLink>
        {track?.explicit && <ExplicitBadge size={big ? 16 : 12} />}
      </div>
      <div className={`truncate ${artistClass}`}>
        {status === 'error' && error ? (
          <span className="text-red">{error}</span>
        ) : (
          <Credits videoId={nowPlaying.videoId} line={nowPlaying.artist} artists={track?.artists ?? []} />
        )}
      </div>
    </div>
  );
}

/**
 * The floating glass dock (desktop and tablet): the record and names on the
 * left, the 3D transport and seek bar in the middle, lyrics, queue, sound,
 * volume and full screen on the right.
 */
export function PlayerDock() {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const nerd = usePlayer((s) => s.showNerdStats);
  const sidePanel = useUi((s) => s.sidePanel);
  const { toggleSidePanel, setFullScreen } = useUi.getState();
  const track = useCurrentTrack();
  const sleepLeft = useSleepLeft();

  return (
    <div
      className="glass-thick pointer-events-auto relative grid h-(--dock-height) w-full grid-cols-[minmax(180px,1fr)_minmax(300px,1.5fr)_minmax(180px,1fr)] items-center gap-4 rounded-[28px] pr-5 pl-3 max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:pr-4"
      role="region"
      aria-label="Player"
    >
      {/* The record peeks out of its sleeve, as on the mint player. */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          data-beat className="relative -my-3 shrink-0 rounded-full shadow-[0_0_calc(8px+var(--beat,0)*28px)_rgba(var(--accent-2-rgb),calc(0.25+var(--beat,0)*0.5))] transition-transform hover:scale-105"
          aria-label="Open the full-screen player"
          onClick={() => nowPlaying && setFullScreen(true)}
        >
          <Vinyl artwork={nowPlaying?.artworkUrl ?? null} size={72} playing={playing} />
        </button>
        <div className="min-w-0 flex-1">
          <NowPlayingNames />
          {nerd && nowPlaying && (
            <div className="mt-0.5 truncate type-[500_10px/13px] text-tertiary">
              <NerdStats />
            </div>
          )}
        </div>
        <FavoriteButton track={track} className="btn-3d size-9 shrink-0 rounded-full max-lg:hidden" size={16} />
      </div>

      <div className="flex flex-col items-center gap-1.5 max-lg:items-end">
        <Transport size="sm" />
        <Scrubber compact className="max-lg:hidden" />
      </div>

      <div className="flex items-center justify-end gap-2 max-lg:hidden">
        {sleepLeft && (
          <span className="rounded-full bg-quinary px-2 py-1 type-[600_10px/12px] text-key" title="Sleep timer">
            🌙 {sleepLeft}
          </span>
        )}
        <button
          className="btn-3d size-9 rounded-full"
          aria-label="Lyrics"
          title="Lyrics (L)"
          aria-pressed={sidePanel === 'lyrics'}
          onClick={() => toggleSidePanel('lyrics')}
        >
          <Mic2 size={16} />
        </button>
        <button
          className="btn-3d size-9 rounded-full"
          aria-label="Up Next"
          title="Up Next (Q)"
          aria-pressed={sidePanel === 'up-next'}
          onClick={() => toggleSidePanel('up-next')}
        >
          <UpNextIcon size={17} />
        </button>
        <SoundMenu size={36} />
        {track && <TrackMenu track={track} placement="above-end" className="btn-3d size-9 rounded-full" />}
        <VolumeSlider className="w-[130px] max-xl:w-[110px]" />
        <button className="btn-3d size-9 rounded-full" aria-label="Full screen player" title="Full screen (F)" disabled={!nowPlaying} onClick={() => setFullScreen(true)}>
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}
