import { Heart } from 'lucide-react';
import type { Track } from '@/data/music/types';
import { useLibrary } from '@/state/library';
import { toast } from '@/state/toast';

interface FavoriteButtonProps {
  /** The track to like; a bare id is looked up in the player's queue. */
  track: Track | null;
  className?: string;
  size?: number;
}

/** The heart: a like in LOQmusic's own library (Liked Songs), no account needed. */
export function FavoriteButton({ track, className = '', size = 18 }: FavoriteButtonProps) {
  const liked = useLibrary((s) => !!track && s.liked.some((t) => t.videoId === track.videoId));
  if (!track) return null;
  return (
    <button
      className={`transition-transform active:scale-90 ${liked ? 'text-key' : ''} ${className}`}
      aria-label={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
      aria-pressed={liked}
      onClick={(event) => {
        event.stopPropagation();
        useLibrary.getState().toggleLike(track);
        toast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs 💜');
      }}
    >
      <Heart size={size} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}
