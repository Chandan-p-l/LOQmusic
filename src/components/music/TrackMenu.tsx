import { Disc3, Heart, ListEnd, ListPlus, ListStart, MoreHorizontal, Radio, Share2, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { openAddToPlaylist } from '@/components/loq/PlaylistDialogs';
import { Menu, MenuItem, MenuSeparator, type MenuPlacement } from '@/components/Menu';
import type { Track } from '@/data/music/types';
import { albumPageFor, artistPageFor } from '@/shell/nowPlayingLinks';
import { useLibrary } from '@/state/library';
import { usePlayer } from '@/state/player';
import { toast } from '@/state/toast';

function TrackMenuItems({ track, onClose }: { track: Track; onClose: () => void }) {
  const navigate = useNavigate();
  const liked = useLibrary((s) => s.liked.some((t) => t.videoId === track.videoId));
  const { playNext, addToQueue, playTrack } = usePlayer.getState();
  const artist = track.artists[0] ?? null;
  const title = `${track.title} ${track.artists.map((a) => a.name).join(' ')}`.trim();
  return (
    <>
      <MenuItem icon={<ListStart size={15} />} onSelect={() => (onClose(), playNext([track]), toast('Playing next'))}>
        Play Next
      </MenuItem>
      <MenuItem icon={<ListEnd size={15} />} onSelect={() => (onClose(), addToQueue([track]), toast('Added to queue'))}>
        Add to Queue
      </MenuItem>
      <MenuItem
        icon={<Radio size={15} />}
        onSelect={() => {
          onClose();
          playTrack(track, { title: `${track.title} Radio`, type: 'other' });
          if (!usePlayer.getState().autoplay) usePlayer.getState().setAutoplay(true);
        }}
      >
        Start Radio
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        icon={<Heart size={15} fill={liked ? 'currentColor' : 'none'} />}
        onSelect={() => {
          useLibrary.getState().toggleLike(track);
          toast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs 💜');
          onClose();
        }}
      >
        {liked ? 'Remove from Liked Songs' : 'Like'}
      </MenuItem>
      <MenuItem icon={<ListPlus size={15} />} onSelect={() => (onClose(), openAddToPlaylist([track]))}>
        Add to Playlist…
      </MenuItem>
      <MenuSeparator />
      {artist && (
        <MenuItem
          icon={<UserRound size={15} />}
          onSelect={() => {
            onClose();
            void artistPageFor(track.videoId, artist).then((href) => navigate(href));
          }}
        >
          Go to Artist
        </MenuItem>
      )}
      <MenuItem
        icon={<Disc3 size={15} />}
        onSelect={() => {
          onClose();
          void albumPageFor(track.videoId, track.album, title).then((href) => navigate(href));
        }}
      >
        Go to Album
      </MenuItem>
      <MenuItem
        icon={<Share2 size={15} />}
        onSelect={() => {
          onClose();
          const url = `https://music.youtube.com/watch?v=${track.videoId}`;
          if (navigator.share) void navigator.share({ title: track.title, url }).catch(() => {});
          else void navigator.clipboard.writeText(url).then(() => toast('Link copied'));
        }}
      >
        Share
      </MenuItem>
    </>
  );
}

/**
 * The ⋯ button at the end of a track row: queue, radio, like, playlists,
 * links and share, all without an account.
 */
export function TrackMenu({
  track,
  className,
  placement,
  onOpenChange,
}: {
  track: Track;
  className?: string;
  /** Where the menu opens from the button; the player's sit at the bottom of the window. */
  placement?: MenuPlacement;
  /** Told when the menu opens and closes; most mounts don't need to know. */
  onOpenChange?: (open: boolean) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = useCallback(() => setAnchor(null), []);
  useEffect(() => {
    onOpenChange?.(anchor !== null);
  }, [anchor, onOpenChange]);
  return (
    <>
      <button
        className={className}
        aria-label={`More options for ${track.title}`}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        data-open={anchor !== null || undefined}
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(anchor ? null : event.currentTarget);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>
      {anchor && (
        <Menu anchor={anchor} placement={placement} onClose={close} label={track.title}>
          <TrackMenuItems track={track} onClose={close} />
        </Menu>
      )}
    </>
  );
}
