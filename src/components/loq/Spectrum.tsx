import { useEffect, useRef } from 'react';
import { readSpectrum } from '@/playback/beat';
import { useLook } from '@/state/look';
import { usePlayer } from '@/state/player';

const BARS = 120;

/**
 * A ring of frequency bars around the record, in the song's colours: lows at
 * the top, mirrored down both sides, so it reads as one shape breathing with
 * the music. Drawn straight from the analyser on a canvas, each frame.
 */
export function SpectrumRing({ className = '' }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reactive = useLook((s) => s.reactive);
  const playing = usePlayer((s) => s.status === 'playing');

  useEffect(() => {
    const el = canvas.current;
    if (!el || !reactive) return;
    const ctx = el.getContext('2d')!;
    let frame = 0;
    const heights = new Float32Array(BARS);
    let colors = ['#a855f7', '#ec4899'];
    let lastColorRead = 0;

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = el.clientWidth;
      if (el.width !== Math.round(size * dpr)) {
        el.width = el.height = Math.round(size * dpr);
      }
      if (now - lastColorRead > 800) {
        const style = getComputedStyle(document.documentElement);
        colors = [style.getPropertyValue('--accent-1').trim() || colors[0]!, style.getPropertyValue('--accent-2').trim() || colors[1]!];
        lastColorRead = now;
      }
      const w = el.width;
      const c = w / 2;
      // The record fills 72% of the canvas; bars start just outside its rim.
      const inner = w * 0.37;
      const maxLen = w * 0.12;
      ctx.clearRect(0, 0, w, w);

      const data = readSpectrum();
      const half = BARS / 2;
      for (let i = 0; i < half; i++) {
        // Log spacing over the useful bins, so the bass doesn't take the whole ring.
        const bin = data ? Math.min(data.length - 1, Math.floor(2 + Math.pow(i / half, 1.7) * 150)) : 0;
        const v = data ? data[bin]! / 255 : 0;
        const target = Math.pow(v, 1.6);
        const k = target > heights[i]! ? 0.5 : 0.08;
        heights[i]! += (target - heights[i]!) * k;
        heights[BARS - 1 - i] = heights[i]!;
      }

      const gradient = ctx.createLinearGradient(0, 0, w, w);
      gradient.addColorStop(0, colors[0]!);
      gradient.addColorStop(1, colors[1]!);
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(2, w * 0.0075);
      ctx.shadowColor = colors[1]!;
      ctx.shadowBlur = w * 0.02;
      ctx.beginPath();
      for (let i = 0; i < BARS; i++) {
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        const len = w * 0.006 + heights[i]! * maxLen;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.moveTo(c + cos * inner, c + sin * inner);
        ctx.lineTo(c + cos * (inner + len), c + sin * (inner + len));
      }
      ctx.stroke();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [reactive, playing]);

  if (!reactive) return null;
  return <canvas ref={canvas} className={`pointer-events-none aspect-square ${className}`} aria-hidden="true" />;
}

/** Light in the song's colours, drifting slowly behind the glass and swelling on the beat. */
export function AuroraBlobs({ className = '' }: { className?: string }) {
  const blob = 'absolute rounded-full blur-[90px] mix-blend-screen will-change-transform';
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className={`${blob} top-[-15%] left-[-10%] size-[60vmax] animate-[drift-a_22s_ease-in-out_infinite] opacity-55`}
        style={{ background: 'radial-gradient(closest-side, var(--accent-1), transparent)', scale: 'calc(1 + var(--beat, 0) * 0.12)' }}
      />
      <div
        className={`${blob} right-[-15%] bottom-[-20%] size-[65vmax] animate-[drift-b_28s_ease-in-out_infinite] opacity-50`}
        style={{ background: 'radial-gradient(closest-side, var(--accent-2), transparent)', scale: 'calc(1 + var(--beat, 0) * 0.1)' }}
      />
      <div
        className={`${blob} top-[30%] left-[35%] size-[40vmax] animate-[drift-c_18s_ease-in-out_infinite] opacity-35`}
        style={{ background: 'radial-gradient(closest-side, var(--aurora-c), transparent)' }}
      />
    </div>
  );
}
