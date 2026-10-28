import { Compass, Home, Library, Search } from 'lucide-react';
import { PauseIcon, PlayIcon, ForwardIcon } from '@/components/icons/Transport';
import { Vinyl } from '@/components/loq/Vinyl';
import { PrefetchNavLink } from '@/components/PrefetchLink';
import { getAudio, usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { useEffect, useRef } from 'react';

const TABS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Library', icon: Library },
];

/** A hairline of progress along the mini player's foot. */
function MiniProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const status = usePlayer((s) => s.status);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const audio = getAudio();
      if (audio && bar.current && audio.duration > 0) bar.current.style.transform = `scaleX(${(audio.currentTime / audio.duration).toFixed(4)})`;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [status]);
  return (
    <div className="absolute inset-x-5 bottom-1.5 h-[3px] overflow-hidden rounded-full bg-[#ffffff1a]">
      <div ref={bar} className="h-full w-full origin-left scale-x-0 rounded-full bg-white will-change-transform" />
    </div>
  );
}

/**
 * The phone's foot: the mini player (a record sliding out of its sleeve, as
 * on the mint player) over the tab bar.
 */
export function MobileNav() {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const { togglePlay, next } = usePlayer.getState();
  const open = useUi((s) => s.setFullScreen);

  return (
    <div className="fixed inset-x-2 bottom-2 z-[calc(var(--z-web-chrome)-1)] hidden flex-col gap-2 max-sm:flex">
      {nowPlaying && (
        <div className="glass-thick relative flex h-[68px] items-center gap-3 rounded-[22px] pr-2 pl-1" role="region" aria-label="Player">
          <button className="-my-2 -ml-3 shrink-0" aria-label="Open the player" onClick={() => open(true)}>
            <Vinyl artwork={nowPlaying.artworkUrl} size={64} playing={playing} />
          </button>
          <button className="min-w-0 flex-1 text-start" onClick={() => open(true)}>
            <p className="truncate type-[700_14px/18px]">{nowPlaying.title}</p>
            <p className="truncate type-[500_12px/16px] text-secondary">{nowPlaying.artist}</p>
          </button>
          <button className="btn-3d-key size-11 rounded-full" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
            {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
          </button>
          <button className="btn-3d size-10 rounded-full" aria-label="Next" onClick={next}>
            <ForwardIcon size={24} />
          </button>
          <MiniProgress />
        </div>
      )}
      <nav className="glass-thick grid h-[62px] grid-cols-4 rounded-[22px] px-1" aria-label="Tabs">
        {TABS.map(({ to, label, icon: Icon }) => (
          <PrefetchNavLink
            key={to}
            to={to}
            className="group flex flex-col items-center justify-center gap-0.5 type-[600_10px/12px] text-tertiary aria-[current=page]:text-primary"
          >
            <span className="grid h-7 w-12 place-items-center rounded-full group-aria-[current=page]:bg-[image:var(--accent-gradient)] group-aria-[current=page]:text-white group-aria-[current=page]:shadow-[inset_0_1px_0_#fff6,0_4px_12px_rgba(var(--accent-2-rgb),.5)]">
              <Icon size={17} strokeWidth={2.3} />
            </span>
            {label}
          </PrefetchNavLink>
        ))}
      </nav>
    </div>
  );
}
