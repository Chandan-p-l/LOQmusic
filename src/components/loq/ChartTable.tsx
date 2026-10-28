import { Pause, Play, X } from 'lucide-react';
import { Artwork } from '@/components/music/Artwork';
import { ExplicitBadge } from '@/components/music/ExplicitBadge';
import { FavoriteButton } from '@/components/music/FavoriteButton';
import { artistHref, formatDuration } from '@/components/music/links';
import { playList } from '@/components/music/play';
import { TrackMenu } from '@/components/music/TrackMenu';
import { PrefetchLink } from '@/components/PrefetchLink';
import type { Track } from '@/data/music/types';
import type { QueueSource } from '@/playback/queue/timeline';
import { usePlayer } from '@/state/player';

/** Animated bars beside the row that's playing. */
export function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[image:var(--accent-gradient)]"
          style={{
            height: '100%',
            animation: playing ? `loq-eq 0.${7 + i}s ease-in-out ${i * 0.12}s infinite alternate` : 'none',
            transform: playing ? undefined : 'scaleY(0.35)',
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </span>
  );
}

/**
 * The chart table from the references: #, artwork and name, artist, time,
 * like and ⋯. Tapping a row plays the list from there.
 */
export function ChartTable({
  tracks,
  source,
  numbered = true,
  showHeader = true,
  fallbackArtwork,
  onRemove,
  trailing,
}: {
  tracks: Track[];
  source: QueueSource;
  numbered?: boolean;
  showHeader?: boolean;
  fallbackArtwork?: string | null;
  /** Shows an ✕ on each row (the listener's own playlists). */
  onRemove?: (index: number) => void;
  /** Small text under the like, per row ("3 hr ago"). */
  trailing?: (index: number) => string | null;
}) {
  const current = usePlayer((s) => s.nowPlaying?.videoId ?? null);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const cols = 'grid grid-cols-[34px_minmax(0,2.2fr)_minmax(0,1.3fr)_56px_var(--last)] items-center gap-3 max-md:grid-cols-[28px_minmax(0,1fr)_var(--last)]';
  const last = trailing ? (onRemove ? '190px' : '160px') : onRemove ? '112px' : '76px';

  return (
    <div className="mx-(--body-gutter) [--last:var(--last-wide)] max-lg:[--last:var(--last-narrow)]" role="table" aria-label={source.title} style={{ '--last-wide': last, '--last-narrow': onRemove ? '112px' : '76px' } as React.CSSProperties}>
      {showHeader && (
        <div className={`${cols} border-b border-divider px-3 pb-2.5 type-[600_12px/16px] text-tertiary`} role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Title</span>
          <span role="columnheader" className="max-md:hidden">Artist</span>
          <span role="columnheader" className="max-md:hidden">Time</span>
          <span role="columnheader" className="text-end">Like</span>
        </div>
      )}
      <div role="rowgroup">
        {tracks.map((track, i) => {
          const isCurrent = track.videoId === current;
          return (
            <div
              key={`${track.videoId}-${i}`}
              role="row"
              className={`${cols} group h-[68px] cursor-pointer rounded-[16px] border-b border-[#ffffff0a] px-3 transition-colors hover:bg-tracklist-hover data-current:bg-[rgba(var(--accent-2-rgb),.12)]`}
              data-current={isCurrent || undefined}
              onClick={() => (isCurrent ? usePlayer.getState().togglePlay() : playList(tracks, i, { source, fallbackArtwork }))}
            >
              <span role="cell" className="type-[600_14px/18px] text-secondary tabular-nums">
                {isCurrent ? (
                  <EqBars playing={playing} />
                ) : (
                  <>
                    <span className="group-hover:hidden">{numbered ? String(i + 1).padStart(2, '0') : '•'}</span>
                    <Play size={14} fill="currentColor" className="hidden text-primary group-hover:block" />
                  </>
                )}
              </span>
              <span role="cell" className="flex min-w-0 items-center gap-3.5">
                <span className="relative size-11 shrink-0">
                  <Artwork src={track.thumbnail ?? fallbackArtwork ?? null} displayWidth={44} radius="10px" />
                  {isCurrent && (
                    <span className="absolute inset-0 grid place-items-center rounded-[10px] bg-[#0007] opacity-0 group-hover:opacity-100">
                      {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className={`flex items-center gap-1 truncate type-[700_14px/18px] ${isCurrent ? 'text-key' : ''}`}>
                    <span className="truncate">{track.title}</span>
                    {track.explicit && <ExplicitBadge />}
                  </span>
                  <span className="hidden truncate type-[500_12px/16px] text-secondary max-md:block">
                    {track.artists.map((a) => a.name).join(', ')}
                  </span>
                </span>
              </span>
              <span role="cell" className="truncate type-[500_13px/17px] text-secondary max-md:hidden">
                {track.artists.map((a, j) => {
                  const href = artistHref(a.id);
                  return (
                    <span key={`${a.name}-${j}`}>
                      {j > 0 && ', '}
                      {href ? (
                        <PrefetchLink to={href} className="hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {a.name}
                        </PrefetchLink>
                      ) : (
                        a.name
                      )}
                    </span>
                  );
                })}
              </span>
              <span role="cell" className="type-[700_13px/17px] tabular-nums max-md:hidden">{formatDuration(track.durationSec)}</span>
              <span role="cell" className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                {trailing?.(i) && <span className="mr-1 type-[500_11px/14px] whitespace-nowrap text-tertiary max-lg:hidden">{trailing(i)}</span>}
                <FavoriteButton track={track} className="grid size-8 place-items-center rounded-full text-secondary hover:bg-quinary hover:text-primary" size={16} />
                <TrackMenu track={track} className="grid size-8 place-items-center rounded-full text-secondary hover:bg-quinary hover:text-primary" />
                {onRemove && (
                  <button
                    className="grid size-8 place-items-center rounded-full text-tertiary hover:bg-quinary hover:text-red"
                    aria-label={`Remove ${track.title}`}
                    onClick={() => onRemove(i)}
                  >
                    <X size={15} />
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
