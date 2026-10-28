import { create } from 'zustand';
import { getAnalyser } from './audioFx';
import { usePlayer } from '@/state/player';
import { useLook } from '@/state/look';

/**
 * The music's pulse, for the visuals: each frame, the bass energy (0–1, with a
 * fast attack and a slow release) is written to `--beat` on the root, where
 * the key button's glow, the record's halo and the ambient light read it. The
 * spectrum itself is read straight from the analyser by the canvases that
 * draw it (Spectrum.tsx). Nothing runs while paused, hidden or switched off.
 */

export const useBeatReady = create<{ ready: boolean }>()(() => ({ ready: false }));

let bins: Uint8Array<ArrayBuffer> | null = null;

/** The current frequency bins (0–255), or null when there's no analyser. */
export function readSpectrum(): Uint8Array<ArrayBuffer> | null {
  const analyser = getAnalyser();
  if (!analyser) return null;
  bins ??= new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(bins);
  return bins;
}

/**
 * Only the elements that pulse (`data-beat`) get the value: writing it to the
 * root would restyle the whole document every frame.
 */
let targets: HTMLElement[] = [];
let lastScan = 0;

function write(value: string, now: number): void {
  if (now - lastScan > 500) {
    targets = [...document.querySelectorAll<HTMLElement>('[data-beat]')];
    lastScan = now;
  }
  for (const el of targets) el.style.setProperty('--beat', value);
}

export function startBeat(): () => void {
  let frame = 0;
  let level = 0;
  let running = false;

  const tick = () => {
    const data = readSpectrum();
    let target = 0;
    if (data) {
      // ~40–260 Hz at 48 kHz with 256 bins: the kick and the bass line.
      let sum = 0;
      for (let i = 1; i < 12; i++) sum += data[i]!;
      target = Math.max(0, (sum / 11 / 255 - 0.35) / 0.6);
    }
    level = target > level ? level + (target - level) * 0.55 : level + (target - level) * 0.12;
    write(level.toFixed(3), performance.now());
    if (!useBeatReady.getState().ready && data) useBeatReady.setState({ ready: true });
    frame = requestAnimationFrame(tick);
  };

  const sync = () => {
    const playing = usePlayer.getState().status === 'playing';
    const want = playing && useLook.getState().reactive && document.visibilityState === 'visible';
    if (want === running) return;
    running = want;
    if (want) frame = requestAnimationFrame(tick);
    else {
      cancelAnimationFrame(frame);
      level = 0;
      write('0', performance.now() + 1000);
    }
  };

  const offPlayer = usePlayer.subscribe((s, prev) => s.status !== prev.status && sync());
  const offLook = useLook.subscribe((s, prev) => s.reactive !== prev.reactive && sync());
  document.addEventListener('visibilitychange', sync);
  sync();
  return () => {
    offPlayer();
    offLook();
    document.removeEventListener('visibilitychange', sync);
    cancelAnimationFrame(frame);
    targets.forEach((el) => el.style.removeProperty('--beat'));
  };
}
