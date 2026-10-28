import { sizedArtwork } from '@/lib/artwork';
import { useLook } from '@/state/look';
import { SafeImg } from './SafeImg';

interface VinylProps {
  artwork: string | null;
  /** The record's diameter in px, or 'fill' to fill a square parent. */
  size: number | 'fill';
  playing: boolean;
  /** The tonearm, swinging onto the record while it plays. */
  arm?: boolean;
  className?: string;
}

/**
 * A record with the song's artwork as its label: it spins while the song
 * plays and the tonearm rests on it. The full-screen player's centrepiece,
 * and the small disc in the dock.
 */
export function Vinyl({ artwork, size, playing, arm = false, className = '' }: VinylProps) {
  const spin = useLook((s) => s.spinVinyl);
  const px = size === 'fill' ? 460 : size;
  const label = artwork ? sizedArtwork(artwork, Math.round(px * 0.62), 1) : null;
  const box = size === 'fill' ? '100%' : size;
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: box, height: box }}>
      {/* A halo in the song's colours, swelling on the beat. */}
      {arm && (
        <div
          data-beat
          className="pointer-events-none absolute -inset-[4%] rounded-full bg-[image:var(--accent-gradient)] blur-[38px] transition-opacity duration-700"
          style={{ opacity: playing ? 'calc(0.32 + var(--beat, 0) * 0.45)' : 0.15, scale: 'calc(1 + var(--beat, 0) * 0.07)' }}
          aria-hidden="true"
        />
      )}
      <div
        className="vinyl absolute inset-0 animate-vinyl"
        style={{ animationPlayState: playing && spin ? 'running' : 'paused' }}
      >
        {/* The label: the artwork, cut round, with a spindle hole. */}
        <div className="absolute inset-[19%] overflow-hidden rounded-full shadow-[0_0_0_3px_#0007,0_0_18px_#0008]">
          <SafeImg src={label} className="size-full object-cover" />
          <div className="absolute top-1/2 left-1/2 size-[9%] -translate-1/2 rounded-full bg-[#0b0912] shadow-[inset_0_1px_2px_#000c,0_0_0_2px_#ffffff22]" />
        </div>
      </div>
      {arm && <Tonearm down={playing} />}
    </div>
  );
}

/** The arm: a pivot top-right, swung onto the outer grooves while playing. */
function Tonearm({ down }: { down: boolean }) {
  return (
    <svg
      viewBox="0 0 100 186"
      className="pointer-events-none absolute drop-shadow-[0_10px_14px_#000a] transition-transform duration-700 ease-[cubic-bezier(.3,1.3,.5,1)]"
      style={{ width: '42%', height: '78%', right: '-12%', top: '-6%', transformOrigin: '76% 12%', transform: `rotate(${down ? 0 : -24}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="arm-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#d9d6e3" />
          <stop offset=".5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9c98a8" />
        </linearGradient>
        <radialGradient id="arm-base" cx=".35" cy=".3">
          <stop offset="0" stopColor="#f4f2f8" />
          <stop offset="1" stopColor="#8d899b" />
        </radialGradient>
      </defs>
      {/* base */}
      <circle cx="76" cy="22" r="18" fill="url(#arm-base)" />
      <circle cx="76" cy="22" r="7" fill="#3a3646" />
      <circle cx="76" cy="22" r="3" fill="var(--accent-2)" />
      {/* arm */}
      <path d="M76 22 L76 120 Q76 140 58 156" stroke="url(#arm-metal)" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* head shell */}
      <g transform="rotate(38 52 162)">
        <rect x="40" y="150" width="24" height="30" rx="4" fill="#2b2836" stroke="#ffffff30" />
        <rect x="46" y="176" width="12" height="6" rx="2" fill="var(--accent-2)" />
      </g>
    </svg>
  );
}
