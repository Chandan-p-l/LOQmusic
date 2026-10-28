import { useEffect, useState } from 'react';

/** An <img> that turns into the accent gradient when the artwork can't load (a live stream's, or a rate-limited CDN). */
export function SafeImg({ src, className = '', alt = '' }: { src: string | null; className?: string; alt?: string }) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setAttempt(0), [src]);
  if (!src || attempt > 1) return <div className={`bg-[image:var(--accent-gradient)] ${className}`} aria-hidden="true" />;
  // YouTube's image CDN refuses bursts of uncached sizes (429): the retry asks
  // for a standard size it keeps cached, a moment later.
  const url = attempt === 0 ? src : src.replace(/=w\d+-h\d+[^/]*$/, '=w544-h544-l90-rj');
  return (
    <img
      key={attempt}
      src={url}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setTimeout(() => setAttempt((n) => n + 1), attempt === 0 ? 600 : 0)}
    />
  );
}
