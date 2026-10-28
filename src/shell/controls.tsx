import { Gauge, Moon, SlidersHorizontal, Sparkles, Volume1, Volume2, VolumeX, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from '@/components/icons/Transport';
import { Menu, MenuHeader, MenuItem, MenuSeparator, type MenuPlacement } from '@/components/Menu';
import { SLEEP_CHOICES, SPEED_CHOICES, useFx } from '@/playback/audioFx';
import { CROSSFADE_CHOICES, usePlayer } from '@/state/player';
import { MixWindowHighlight } from './NerdStats';
import { useScrubber } from './useScrubber';

/** The seek bar: a glossy accent fill with a knob, the times at its ends. */
export function Scrubber({ compact = false, inline = false, className = '' }: { compact?: boolean; inline?: boolean; className?: string }) {
  const { bar, elapsed, remaining, mixLabel, dragging, handlers } = useScrubber();
  const times = (
    <>
      <span ref={elapsed} className="tabular-nums" />
      <span ref={mixLabel} className="pointer-events-none absolute inset-x-0 text-center text-key opacity-0" aria-hidden="true">
        Mixing
      </span>
      <span ref={remaining} className="tabular-nums" />
    </>
  );
  const track = (
    <div className="group/hit flex h-4 flex-1 cursor-pointer touch-none items-center" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} {...handlers}>
        <div className="relative h-1.5 flex-1 rounded-full bg-[#ffffff38]" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <MixWindowHighlight />
          </div>
          {/* Moved by transforms alone (no layout, no repaint of the glass around it). */}
          <div ref={bar} className="absolute inset-0 [--progress:0]">
            <div className="absolute inset-0 origin-left scale-x-(--progress) rounded-full bg-white shadow-[0_0_10px_#ffffff80] will-change-transform" />
            <div className="absolute inset-0 translate-x-[calc(var(--progress)*100%)] will-change-transform">
              <span className="absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full bg-white shadow-[0_2px_8px_#0007] transition-[scale] group-hover/hit:scale-100 group-data-dragging/scrub:scale-110" />
            </div>
          </div>
        </div>
      </div>
  );
  if (inline) {
    // The times at the line's two ends, as on the reference's stage.
    return (
      <div className={`group/scrub relative flex w-full items-center gap-3 type-[500_12px/16px] text-secondary ${className}`} data-dragging={dragging || undefined}>
        <span ref={elapsed} className="w-10 text-end tabular-nums" />
        {track}
        <span ref={remaining} className="w-10 tabular-nums" />
        <span ref={mixLabel} className="pointer-events-none absolute inset-x-0 -top-4 text-center text-key opacity-0" aria-hidden="true">
          Mixing
        </span>
      </div>
    );
  }
  return (
    <div className={`group/scrub w-full ${className}`} data-dragging={dragging || undefined}>
      {track}
      {!compact && <div className="relative mt-1 flex justify-between type-[600_11px/14px] text-tertiary">{times}</div>}
      {compact && <div className="sr-only">{times}</div>}
    </div>
  );
}

/** Shuffle · previous · PLAY · next · repeat, as raised 3D keys. */
export function Transport({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const hasTrack = usePlayer((s) => s.nowPlaying !== null);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const loading = usePlayer((s) => s.status === 'loading' || s.status === 'buffering');
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat !== 'off' || (s.autoplay && s.index >= 0));
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const { togglePlay, next, previous, toggleShuffle, cycleRepeat } = usePlayer.getState();
  const d = { sm: { play: 44, skip: 36, toggle: 30, icon: 26 }, md: { play: 54, skip: 42, toggle: 34, icon: 30 }, lg: { play: 76, skip: 56, toggle: 44, icon: 38 } }[size];

  return (
    <div className={`flex items-center justify-center gap-[clamp(8px,1.4vw,18px)] ${className}`}>
      <button
        className="btn-3d rounded-full text-secondary"
        style={{ width: d.toggle, height: d.toggle }}
        aria-label="Shuffle"
        aria-pressed={shuffle}
        onClick={toggleShuffle}
      >
        <ShuffleIcon size={d.icon * 0.8} />
      </button>
      <button className="btn-3d rounded-full" style={{ width: d.skip, height: d.skip }} disabled={!hasTrack} aria-label="Previous" onClick={previous}>
        <BackwardIcon size={d.icon} />
      </button>
      <button
        data-beat
        className="btn-3d-key rounded-full"
        style={{ width: d.play, height: d.play }}
        disabled={!hasTrack}
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={togglePlay}
      >
        {loading ? (
          <span className="size-[40%] animate-spin rounded-full border-[3px] border-current border-t-transparent" />
        ) : playing ? (
          <PauseIcon size={d.icon * 1.15} />
        ) : (
          <PlayIcon size={d.icon * 1.15} />
        )}
      </button>
      <button className="btn-3d rounded-full" style={{ width: d.skip, height: d.skip }} disabled={!hasTrack || !hasNext} aria-label="Next" onClick={next}>
        <ForwardIcon size={d.icon} />
      </button>
      <button
        className="btn-3d rounded-full text-secondary"
        style={{ width: d.toggle, height: d.toggle }}
        aria-label={repeat === 'one' ? 'Repeat one' : repeat === 'all' ? 'Repeat all' : 'Repeat'}
        aria-pressed={repeat !== 'off'}
        onClick={cycleRepeat}
      >
        {repeat === 'one' ? <RepeatOneIcon size={d.icon * 0.8} /> : <RepeatIcon size={d.icon * 0.8} />}
      </button>
    </div>
  );
}

/** Mute toggle and a level slider; the wheel nudges it too. */
export function VolumeSlider({ className = '' }: { className?: string }) {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const { setVolume, toggleMute } = usePlayer.getState();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      onWheel={(e) => setVolume(Math.min(1, Math.max(0, volume - Math.sign(e.deltaY) * 0.05)))}
    >
      <button className="btn-3d size-8 shrink-0 rounded-full" aria-label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>
        <Icon size={15} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        aria-label="Volume"
        className="loq-range w-full min-w-16"
        style={{ '--fill': `${level * 100}%` } as React.CSSProperties}
        onChange={(e) => {
          if (muted) toggleMute();
          setVolume(Number(e.target.value));
        }}
      />
    </div>
  );
}

function sleepLabel(left: number): string {
  const m = Math.ceil(left / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

/** The time left on the sleep timer, ticking; null when it's off. */
export function useSleepLeft(): string | null {
  const sleep = useFx((s) => s.sleep);
  const [, tick] = useState(0);
  useEffect(() => {
    if (sleep.kind !== 'at') return;
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, [sleep]);
  if (sleep.kind === 'off') return null;
  if (sleep.kind === 'end-of-track') return 'End of track';
  return sleepLabel(sleep.endsAt - Date.now());
}

/**
 * The sound menu: speed, sleep timer, crossfade, AutoMix and the equalizer.
 * What the phone app keeps under its now-playing ⋯.
 */
export function SoundMenu({ placement = 'above-end', className = '', size = 36 }: { placement?: MenuPlacement; className?: string; size?: number }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<'main' | 'speed' | 'sleep' | 'crossfade'>('main');
  const navigate = useNavigate();
  const fx = useFx();
  const crossfade = usePlayer((s) => s.crossfadeSec);
  const automix = usePlayer((s) => s.automix);
  const nerd = usePlayer((s) => s.showNerdStats);
  const videoId = usePlayer((s) => s.nowPlaying?.videoId ?? null);
  const sleepLeft = useSleepLeft();
  const close = () => {
    setAnchor(null);
    setView('main');
  };
  const active = fx.eqEnabled || fx.speed !== 1 || sleepLeft !== null || automix;

  return (
    <>
      <button
        className={`btn-3d rounded-full ${active ? 'text-key' : ''} ${className}`}
        style={{ width: size, height: size }}
        aria-label="Sound settings"
        title="Speed, sleep timer, equalizer, AutoMix"
        aria-haspopup="menu"
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
      >
        <SlidersHorizontal size={size * 0.42} />
      </button>
      {anchor && (
        <Menu anchor={anchor} placement={placement} onClose={close} label="Sound">
          {view === 'main' && (
            <>
              <MenuItem icon={<Gauge size={15} />} trailing={<span className="text-secondary">{fx.speed}×</span>} onSelect={() => setView('speed')}>
                Playback Speed
              </MenuItem>
              <MenuItem icon={<Moon size={15} />} trailing={<span className="text-secondary">{sleepLeft ?? 'Off'}</span>} onSelect={() => setView('sleep')}>
                Sleep Timer
              </MenuItem>
              <MenuItem icon={<SlidersHorizontal size={15} />} trailing={<span className="text-secondary">{fx.eqEnabled ? fx.preset : 'Off'}</span>} onSelect={() => (close(), navigate('/settings#equalizer'))}>
                Equalizer
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={<Waves size={15} />} trailing={<span className="text-secondary">{automix ? 'AutoMix' : crossfade ? `${crossfade}s` : 'Off'}</span>} onSelect={() => setView('crossfade')}>
                Crossfade
              </MenuItem>
              <MenuItem icon={<Sparkles size={15} />} checked={automix} onSelect={() => usePlayer.getState().setAutomix(!automix)}>
                AutoMix (DJ transitions)
              </MenuItem>
              <MenuItem checked={nerd} onSelect={() => usePlayer.getState().setShowNerdStats(!nerd)}>
                Stats for Nerds
              </MenuItem>
            </>
          )}
          {view === 'speed' && (
            <>
              <MenuHeader>Playback Speed</MenuHeader>
              {SPEED_CHOICES.map((s) => (
                <MenuItem key={s} checked={fx.speed === s} onSelect={() => (fx.setSpeed(s), close())}>
                  {s === 1 ? 'Normal' : `${s}×`}
                </MenuItem>
              ))}
              {automix && <MenuHeader>AutoMix sets the speed while it's on.</MenuHeader>}
            </>
          )}
          {view === 'sleep' && (
            <>
              <MenuHeader>Stop Playing In</MenuHeader>
              {SLEEP_CHOICES.map((m) => (
                <MenuItem key={m} onSelect={() => (fx.sleepIn(m), close())}>
                  {m < 60 ? `${m} minutes` : m === 60 ? '1 hour' : `${m / 60} hours`}
                </MenuItem>
              ))}
              <MenuItem onSelect={() => (fx.sleepAfterTrack(videoId), close())}>End of this track</MenuItem>
              {sleepLeft && (
                <>
                  <MenuSeparator />
                  <MenuItem destructive onSelect={() => (fx.cancelSleep(), close())}>
                    Turn Off Timer ({sleepLeft})
                  </MenuItem>
                </>
              )}
            </>
          )}
          {view === 'crossfade' && (
            <>
              <MenuHeader>Crossfade Between Songs</MenuHeader>
              {CROSSFADE_CHOICES.map((s) => (
                <MenuItem key={s} checked={!automix && crossfade === s} onSelect={() => (usePlayer.getState().setCrossfade(s), close())}>
                  {s === 0 ? 'Off' : `${s} seconds`}
                </MenuItem>
              ))}
            </>
          )}
        </Menu>
      )}
    </>
  );
}
