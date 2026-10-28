import { Check, ListPlus, Plus, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { PrefetchLink } from '@/components/PrefetchLink';
import { PlayIcon } from '@/components/icons/Transport';
import { openAddToPlaylist } from '@/components/loq/PlaylistDialogs';
import { useLibrary } from '@/state/library';
import { toast } from '@/state/toast';
import type { AppleMotion } from '@/data/apple/motionArt';
import type { HeaderInfo, MusicItem, Track } from '@/data/music/types';
import { Artwork } from './Artwork';
import { ExplicitBadge } from './ExplicitBadge';
import { MotionArtwork } from './MotionArtwork';
import { artistHref } from './links';

interface DetailHeaderProps {
  info: HeaderInfo;
  onPlay: () => void;
  onShuffle: () => void;
  canPlay: boolean;
  /** More actions after the library toggle (a Spotify playlist's Import). */
  extra?: React.ReactNode;
  /** Apple's motion artwork for an album, over the cover once it plays. */
  motion?: AppleMotion | null;
  /** What the + saves to LOQmusic's library (an album or a playlist). */
  saveItem?: MusicItem | null;
  /** The tracks, for Add to Playlist. */
  tracks?: Track[];
}

/** Shuffle (circle) · Play (pill), report §14; also the Spotify playlist's Import button. */
export const detailButton = {
  pill: 'btn-3d-key !inline-flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full px-6 type-[700_15px/20px]',
  circle: 'btn-3d size-12 rounded-full',
};

/**
 * Album and playlist header (report §3, §14): artwork with its glow, title,
 * artist, metadata, a three-line description, then Shuffle · Play.
 */
export function DetailHeader({ info, onPlay, onShuffle, canPlay, extra, motion, saveItem, tracks }: DetailHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const saved = useLibrary((s) => !!saveItem && s.isSaved(saveItem.id));
  return (
    // Artwork beside the headings, description and actions; stacked and centred below 768px.
    <div className="glass mx-(--body-gutter) mt-6 mb-8 grid rounded-[32px] p-7 max-md:p-5 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_1fr_auto] gap-x-[34px] pt-0 [grid-template-areas:'artwork_headings'_'artwork_description'_'artwork_actions'] max-md:grid-cols-[1fr] max-md:grid-rows-[auto] max-md:justify-items-center max-md:pt-4 max-md:text-center max-md:[grid-template-areas:'artwork'_'headings'_'actions'_'description']">
      <div className="relative w-[270px] self-start rounded-artwork-lg shadow-[0_10px_20px_0_var(--radiosityShadowColor)] [grid-area:artwork] max-lg:w-[220px] max-md:w-[min(270px,70vw)]">
        {info.thumbnail && (
          // A blurred copy behind the artwork: Apple's radiosity glow.
          <div className="absolute inset-0 -z-1 scale-88 opacity-30 blur-[20px] saturate-200" aria-hidden="true">
            <Artwork src={info.thumbnail} displayWidth={80} radius="var(--radius-artwork-large)" />
          </div>
        )}
        <Artwork src={info.thumbnail} displayWidth={270} radius="var(--radius-artwork-large)" eager />
        {/* Apple's motion artwork, over the cover once it's playing. */}
        {motion && (
          <MotionArtwork
            key={motion.url}
            motion={motion}
            className="absolute inset-0 size-full rounded-artwork-lg object-cover opacity-0 transition-opacity duration-600 ease-in data-ready:opacity-100"
          />
        )}
      </div>
      <div className="flex flex-col pt-4 [grid-area:headings] max-md:items-center max-md:pt-5">
        <h1 className="flex items-center type-[800_40px/46px] tracking-[-0.02em] max-lg:type-[800_30px/36px] max-md:justify-center">
          {info.title}
          {info.explicit && <ExplicitBadge size={16} />}
        </h1>
        {info.artists.length > 0 && (
          <div className="mt-1 type-[600_20px/28px] text-gradient">
            {info.artists.map((artist, i) => {
              const href = artistHref(artist.id);
              return (
                <span key={`${artist.name}-${i}`}>
                  {i > 0 && ', '}
                  {href ? (
                    <PrefetchLink to={href} className="hover:underline">
                      {artist.name}
                    </PrefetchLink>
                  ) : (
                    artist.name
                  )}
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-1 type-callout-emphasized text-secondary">{[info.subtitle, info.meta].filter(Boolean).join(' · ')}</div>
      </div>
      {info.description && (
        <div className="mt-[38px] flex max-w-[440px] items-end type-body-tall text-secondary [grid-area:description] max-md:mt-5">
          <p className={expanded ? 'min-w-0' : 'min-w-0 line-clamp-3'}>
            {info.description}
          </p>
          {!expanded && info.description.length > 180 && (
            <button className="shrink-0 ps-[5px] type-subhead-emphasized text-primary" onClick={() => setExpanded(true)}>
              MORE
            </button>
          )}
        </div>
      )}
      <div className="mt-3.5 flex items-center gap-3.5 self-end [grid-area:actions]">
        <button className={detailButton.circle} aria-label="Shuffle" onClick={onShuffle} disabled={!canPlay}>
          <Shuffle size={18} strokeWidth={2.2} />
        </button>
        <button className={detailButton.pill} onClick={onPlay} disabled={!canPlay}>
          <PlayIcon size={18} />
          <span>Play</span>
        </button>
        {saveItem && (
          <button
            className={detailButton.circle}
            aria-label={saved ? 'Remove from Library' : 'Add to Library'}
            aria-pressed={saved}
            title={saved ? 'In your library' : 'Add to Library'}
            onClick={() => {
              useLibrary.getState().toggleSaved(saveItem);
              toast(saved ? 'Removed from your library' : 'Saved to your library');
            }}
          >
            {saved ? <Check size={18} strokeWidth={2.4} /> : <Plus size={18} strokeWidth={2.4} />}
          </button>
        )}
        {tracks && tracks.length > 0 && (
          <button className={detailButton.circle} aria-label="Add all to a playlist" title="Add all to a playlist" onClick={() => openAddToPlaylist(tracks)}>
            <ListPlus size={18} strokeWidth={2.2} />
          </button>
        )}
        {extra}
      </div>
    </div>
  );
}
