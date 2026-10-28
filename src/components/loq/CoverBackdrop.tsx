import { useEffect, useState } from 'react';

/**
 * The song's cover as the room the glass floats in: blown up past the edges,
 * blurred and dimmed so words stay readable, with a new song's cover fading
 * in over the last. With nothing playing, a still liquid wallpaper in the
 * accent colours stands in.
 *
 * It holds still: the liquid glass refracts whatever is behind it, and a
 * moving backdrop would make every pane re-render its filter every frame.
 */
export function CoverBackdrop({ url, blur = 28, dim = 0.6, className = '' }: { url: string | null; blur?: number; dim?: number; className?: string }) {
  const [layers, setLayers] = useState<string[]>(() => (url ? [url] : []));
  useEffect(() => {
    if (!url) return setLayers([]);
    setLayers((current) => (current[current.length - 1] === url ? current : [...current.slice(-1), url]));
  }, [url]);

  return (
    <div className={`overflow-hidden bg-[#0b0912] ${className}`} aria-hidden="true">
      <Wallpaper />
      {layers.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-[-8%] size-[116%] animate-[fade-in_1.2s_ease_both] object-cover [transform:translateZ(0)]"
          style={{ filter: `blur(${blur}px) brightness(${dim}) saturate(1.35)` }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_35%,#0000008c_100%)]" />
      <div className="absolute inset-0 bg-grain opacity-[0.035]" />
    </div>
  );
}

/** Flowing bands of colour (the macOS-style wave), for when there's no cover. */
function Wallpaper() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="wp-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--aurora-a)" />
          <stop offset="1" stopColor="var(--accent-1)" />
        </linearGradient>
        <linearGradient id="wp-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--aurora-c)" />
        </linearGradient>
        <filter id="wp-soft">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <rect width="1600" height="1000" fill="#0d0a16" />
      <g filter="url(#wp-soft)" opacity="0.85">
        <path d="M-100 620 C 300 380, 700 860, 1100 560 S 1700 420, 1800 520 L 1800 1100 L -100 1100 Z" fill="url(#wp-a)" opacity="0.75" />
        <path d="M-100 300 C 400 120, 800 520, 1200 260 S 1650 120, 1800 200 L 1800 -100 L -100 -100 Z" fill="url(#wp-b)" opacity="0.55" />
        <path d="M200 1100 C 500 700, 1000 900, 1700 640 L 1800 1100 Z" fill="url(#wp-b)" opacity="0.45" />
        <ellipse cx="1180" cy="460" rx="420" ry="120" fill="#ffffff" opacity="0.08" transform="rotate(-18 1180 460)" />
      </g>
    </svg>
  );
}
