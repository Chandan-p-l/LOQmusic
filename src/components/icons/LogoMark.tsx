/** LOQmusic's mark: a glossy tile holding a record. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="loq-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-1)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
        <linearGradient id="loq-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#loq-g)" />
      <circle cx="32" cy="32" r="17" fill="#120e1c" />
      <circle cx="32" cy="32" r="13" fill="none" stroke="#fff" strokeOpacity=".12" />
      <circle cx="32" cy="32" r="9.5" fill="none" stroke="#fff" strokeOpacity=".1" />
      <circle cx="32" cy="32" r="5.5" fill="url(#loq-g)" />
      <circle cx="32" cy="32" r="1.6" fill="#120e1c" />
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#loq-s)" />
    </svg>
  );
}

/** The wordmark: LOQ in the accent gradient, music in white. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`type-[800_21px/24px] tracking-[-0.02em] ${className}`}>
      <span className="text-gradient">LOQ</span>
      <span>music</span>
    </span>
  );
}
