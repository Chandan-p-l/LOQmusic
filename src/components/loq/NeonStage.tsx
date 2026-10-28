import { Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BackwardIcon, ForwardIcon, PauseIcon, PlayIcon } from '@/components/icons/Transport';
import { sizedArtwork } from '@/lib/artwork';
import { readSpectrum } from '@/playback/beat';
import { ensureAudioGraph, usePlayer } from '@/state/player';
import { CoverBackdrop } from './CoverBackdrop';
import { SafeImg } from './SafeImg';

/** Neon bars down each side edge. */
const BARS = 18;
/** How long the pointer can rest before the controls fade. */
const IDLE_MS = 2600;

/**
 * Neon mode: the song alone on a dark stage, in the browser's true full
 * screen, with neon light running down both side edges that dances to the
 * music. Each bar on an edge listens to its own slice of the spectrum, bass
 * in the middle and highs toward the corners; the top and bottom edges
 * breathe with the overall loudness. Everything moves by transform and
 * opacity only, so the GPU does it without repainting.
 */
export function NeonStage({ onExit }: { onExit: () => void }) {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const { togglePlay, next, previous } = usePlayer.getState();
  const left = useRef<(HTMLDivElement | null)[]>([]);
  const right = useRef<(HTMLDivElement | null)[]>([]);
  const washes = useRef<(HTMLDivElement | null)[]>([]);
  const rims = useRef<(HTMLDivElement | null)[]>([]);
  const cover = useRef<HTMLDivElement>(null);
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The real full screen, and back out when the browser leaves it (Esc).
  useEffect(() => {
    // The spectrum needs the audio graph; entering was a click, so it may start.
    void ensureAudioGraph().catch(() => {});
    const root = document.documentElement;
    if (document.fullscreenEnabled && !document.fullscreenElement) void root.requestFullscreen().catch(() => {});
    const onChange = () => !document.fullscreenElement && onExit();
    document.addEventListener('fullscreenchange', onChange);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onExit();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey, true);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [onExit]);

  // The controls show on movement and fade when the pointer rests.
  const wake = () => {
    setIdle(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setIdle(true), IDLE_MS);
  };
  useEffect(() => {
    wake();
    return () => void (timer.current && clearTimeout(timer.current));
  }, []);

  // The light show.
  useEffect(() => {
    const levels = new Float32Array(BARS);
    let loud = 0;
    let frame = 0;
    const draw = (now: number) => {
      const data = readSpectrum();
      const paused = !usePlayer.getState().status.startsWith('play') && usePlayer.getState().status !== 'buffering';
      let sum = 0;
      for (let i = 0; i < BARS; i++) {
        // Middle of the edge is bar 0 (bass), the corners the highs.
        let target: number;
        if (data && !paused) {
          const bin = Math.min(data.length - 1, Math.floor(2 + Math.pow(i / (BARS - 1), 1.5) * 150));
          target = Math.pow(data[bin]! / 255, 1.4);
        } else {
          // No analyser (or paused): a slow breath, so the stage never goes dead.
          target = 0.18 + 0.12 * Math.sin(now / 900 + i * 0.5);
        }
        levels[i]! += (target - levels[i]!) * (target > levels[i]! ? 0.45 : 0.1);
        sum += levels[i]!;
      }
      loud += (sum / BARS - loud) * 0.15;

      const half = (BARS - 1) / 2;
      for (let j = 0; j < BARS; j++) {
        const band = Math.round((Math.abs(j - half) / half) * (BARS - 1));
        const v = levels[band]!;
        const transform = `scaleX(${(0.35 + v * 1.9).toFixed(3)})`;
        const opacity = (0.25 + v * 0.75).toFixed(3);
        for (const el of [left.current[j], right.current[j]]) {
          if (!el) continue;
          el.style.transform = transform;
          el.style.opacity = opacity;
        }
      }
      const bass = (levels[0]! + levels[1]! + levels[2]!) / 3;
      for (const el of washes.current) if (el) el.style.opacity = (0.15 + bass * 0.85).toFixed(3);
      for (const el of rims.current) if (el) el.style.opacity = (0.2 + loud * 1.6).toFixed(3);
      if (cover.current) cover.current.style.transform = `scale(${(1 + bass * 0.025).toFixed(4)})`;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!nowPlaying) return null;
  const art = nowPlaying.artworkUrl ? sizedArtwork(nowPlaying.artworkUrl, 640, 1) : null;
  const bar = (side: 'left' | 'right', j: number) => (
    <div
      key={j}
      ref={(el) => void ((side === 'left' ? left : right).current[j] = el)}
      className={`h-full w-[9px] rounded-full will-change-transform ${side === 'left' ? 'origin-left' : 'origin-right'}`}
      style={{
        // Colour runs from one accent to the other along the edge.
        background: `color-mix(in oklab, var(--accent-1) ${Math.round((j / (BARS - 1)) * 100)}%, var(--accent-2))`,
        boxShadow: `0 0 10px 1px color-mix(in oklab, var(--accent-1) ${Math.round((j / (BARS - 1)) * 100)}%, var(--accent-2)), 0 0 34px 6px color-mix(in oklab, var(--accent-1) ${Math.round((j / (BARS - 1)) * 100)}%, transparent)`,
      }}
    />
  );

  return (
    <div
      className="fixed inset-0 z-10 overflow-hidden bg-black text-white"
      style={idle && playing ? { cursor: 'none' } : undefined}
      onPointerMove={wake}
      onPointerDown={wake}
      role="dialog"
      aria-label="Neon mode"
    >
      {/* A whisper of the cover behind, so the neon has a room to light. */}
      <CoverBackdrop url={art} blur={60} dim={0.25} className="absolute inset-0" />

      {/* The washes: broad light thrown from each side, swelling with the bass. */}
      {(['left', 'right'] as const).map((side, i) => (
        <div
          key={side}
          ref={(el) => void (washes.current[i] = el)}
          className={`pointer-events-none absolute inset-y-0 w-[38vw] will-change-[opacity] ${side === 'left' ? 'left-0' : 'right-0'}`}
          style={{
            background: `radial-gradient(60% 75% at ${side === 'left' ? '0%' : '100%'} 50%, rgba(var(--accent-${side === 'left' ? 2 : 1}-rgb), 0.55), transparent 70%)`,
          }}
        />
      ))}

      {/* The neon tubes down both sides. */}
      <div className="pointer-events-none absolute inset-y-[3vh] left-[10px] flex flex-col justify-between gap-[0.8vh]">
        {Array.from({ length: BARS }, (_, j) => bar('left', j))}
      </div>
      <div className="pointer-events-none absolute inset-y-[3vh] right-[10px] flex flex-col items-end justify-between gap-[0.8vh]">
        {Array.from({ length: BARS }, (_, j) => bar('right', j))}
      </div>

      {/* Top and bottom rims, breathing with the loudness. */}
      {(['top', 'bottom'] as const).map((edge, i) => (
        <div
          key={edge}
          ref={(el) => void (rims.current[i] = el)}
          className={`pointer-events-none absolute inset-x-[6vw] h-[3px] rounded-full will-change-[opacity] ${edge === 'top' ? 'top-[8px]' : 'bottom-[8px]'}`}
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent-2), var(--accent-1), var(--accent-2), transparent)',
            boxShadow: '0 0 14px 2px rgba(var(--accent-2-rgb), .8), 0 0 50px 10px rgba(var(--accent-1-rgb), .35)',
          }}
        />
      ))}

      {/* The song. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh] px-[8vw] pb-[10vh]">
        <div className="relative">
          <div ref={cover} className="relative aspect-square w-[min(52vh,44vw)] will-change-transform max-md:w-[70vw]">
            <div className="absolute inset-0 rounded-[28px] shadow-[0_0_80px_10px_rgba(var(--accent-2-rgb),.35),0_40px_100px_#000]" />
            <SafeImg src={art} className="relative size-full rounded-[28px] object-cover" />
            <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(155deg,#ffffff2e_0%,transparent_40%)] shadow-[inset_1px_1px_0_#ffffff59,inset_0_0_0_0.5px_#ffffff26]" />
          </div>
          {/* Its reflection on the stage floor. */}
          <div className="pointer-events-none absolute top-full left-0 mt-2 aspect-square w-full -scale-y-100 opacity-25 [mask-image:linear-gradient(0deg,#000_0%,transparent_28%)]">
            <SafeImg src={art} className="size-full rounded-[28px] object-cover blur-[2px]" />
          </div>
        </div>
        <div className="relative text-center">
          <h1 className="type-[300_clamp(28px,4.4vh,48px)/1.15] tracking-[0.02em] [text-shadow:0_0_30px_rgba(var(--accent-2-rgb),.6)]">{nowPlaying.title}</h1>
          <p className="mt-2 type-[500_clamp(15px,2.2vh,22px)/1.3] text-secondary">{nowPlaying.artist}</p>
        </div>
      </div>

      {/* Controls, fading away while the pointer rests. */}
      <div
        data-flat-glass
        className="glass-thick absolute bottom-[3.5vh] left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full px-3 py-2.5 transition-opacity duration-500"
        style={{ opacity: idle && playing ? 0 : 1, pointerEvents: idle && playing ? 'none' : 'auto' }}
      >
        <button className="btn-3d size-11 rounded-full" aria-label="Previous" onClick={previous}>
          <BackwardIcon size={28} />
        </button>
        <button className="btn-3d-key size-14 rounded-full" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
          {playing ? <PauseIcon size={34} /> : <PlayIcon size={34} />}
        </button>
        <button className="btn-3d size-11 rounded-full" aria-label="Next" onClick={next}>
          <ForwardIcon size={28} />
        </button>
        <span className="mx-1 h-7 w-px bg-[#ffffff26]" />
        <button className="btn-3d size-11 rounded-full" aria-label="Leave neon mode" title="Leave neon mode (Esc)" onClick={onExit}>
          <Minimize2 size={17} />
        </button>
      </div>
    </div>
  );
}
