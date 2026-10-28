import { create } from 'zustand';

/**
 * The phone app's sound controls that the web player lacked: a 10-band
 * equalizer, playback speed and a sleep timer.
 *
 * The equalizer sits at the end of AutoMix's Web Audio graph (master → EQ →
 * speakers; automix/index.ts), so it shapes everything heard, blends included.
 * The graph is built the first time the EQ is switched on, as AutoMix builds it.
 */

export const EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_LIMIT_DB = 12;

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [7, 6, 5, 3, 1, 0, 0, 0, 0, 0],
  'Bass Reducer': [-6, -5, -4, -2, -1, 0, 0, 0, 0, 0],
  'Treble Boost': [0, 0, 0, 0, 0, 1, 3, 5, 6, 7],
  Vocal: [-2, -2, -1, 1, 3, 4, 4, 2, 0, -1],
  Pop: [-1, 1, 3, 4, 3, 0, -1, -1, 1, 2],
  Rock: [5, 4, 2, -1, -2, -1, 2, 3, 4, 4],
  'Hip-Hop': [6, 5, 2, 3, -1, -1, 1, 0, 2, 3],
  Electronic: [5, 4, 1, 0, -2, 2, 1, 2, 4, 5],
  Jazz: [3, 2, 1, 2, -2, -2, 0, 1, 2, 3],
  Classical: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  Acoustic: [4, 4, 3, 1, 2, 2, 3, 3, 2, 1],
  Loudness: [6, 4, 0, 0, -2, 0, -1, -4, 4, 2],
  'Late Night': [-3, -2, 0, 2, 3, 3, 2, 0, -2, -4],
};

export const SPEED_CHOICES = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2] as const;
export const SLEEP_CHOICES = [5, 10, 15, 30, 45, 60, 90] as const;

type Sleep = { kind: 'off' } | { kind: 'at'; endsAt: number; minutes: number } | { kind: 'end-of-track'; videoId: string | null };

interface FxState {
  eqEnabled: boolean;
  gains: number[];
  preset: string;
  preamp: number;
  speed: number;
  sleep: Sleep;
  setEqEnabled: (on: boolean) => void;
  setGain: (band: number, db: number) => void;
  setPreset: (name: string) => void;
  setPreamp: (db: number) => void;
  setSpeed: (speed: number) => void;
  sleepIn: (minutes: number) => void;
  sleepAfterTrack: (videoId: string | null) => void;
  cancelSleep: () => void;
}

const KEY = 'loqmusic:fx';

interface Saved {
  eqEnabled: boolean;
  gains: number[];
  preset: string;
  preamp: number;
  speed: number;
}

function load(): Saved {
  const fallback: Saved = { eqEnabled: false, gains: [...EQ_PRESETS.Flat!], preset: 'Flat', preamp: 0, speed: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>;
    const merged = { ...fallback, ...saved };
    if (merged.gains.length !== EQ_BANDS.length) merged.gains = fallback.gains;
    return merged;
  } catch {
    return fallback;
  }
}

export const useFx = create<FxState>()((set, get) => ({
  ...load(),
  sleep: { kind: 'off' },
  setEqEnabled: (eqEnabled) => set({ eqEnabled }),
  setGain: (band, db) => {
    const gains = [...get().gains];
    gains[band] = Math.max(-EQ_LIMIT_DB, Math.min(EQ_LIMIT_DB, db));
    set({ gains, preset: 'Custom', eqEnabled: true });
  },
  setPreset: (preset) => {
    const gains = EQ_PRESETS[preset];
    if (gains) set({ gains: [...gains], preset, eqEnabled: true });
  },
  setPreamp: (preamp) => set({ preamp }),
  setSpeed: (speed) => set({ speed }),
  sleepIn: (minutes) => set({ sleep: { kind: 'at', endsAt: Date.now() + minutes * 60_000, minutes } }),
  sleepAfterTrack: (videoId) => set({ sleep: { kind: 'end-of-track', videoId } }),
  cancelSleep: () => set({ sleep: { kind: 'off' } }),
}));

useFx.subscribe((s) => {
  const { eqEnabled, gains, preset, preamp, speed } = s;
  try {
    localStorage.setItem(KEY, JSON.stringify({ eqEnabled, gains, preset, preamp, speed }));
  } catch {
    // Not saved; it still applies for this visit.
  }
});

// ---- The EQ chain in the graph -------------------------------------------------------

interface Chain {
  ctx: AudioContext;
  preamp: GainNode;
  filters: BiquadFilterNode[];
  analyser: AnalyserNode;
}

let chain: Chain | null = null;

const dbToGain = (db: number) => Math.pow(10, db / 20);

function applyEq(): void {
  if (!chain) return;
  const { eqEnabled, gains, preamp } = useFx.getState();
  const now = chain.ctx.currentTime;
  chain.filters.forEach((filter, i) => filter.gain.setTargetAtTime(eqEnabled ? (gains[i] ?? 0) : 0, now, 0.03));
  chain.preamp.gain.setTargetAtTime(eqEnabled ? dbToGain(preamp) : 1, now, 0.03);
}

/**
 * Builds the EQ between [source] and the speakers; called once by
 * createAutomixGraph with its master gain.
 */
export function connectFx(ctx: AudioContext, source: AudioNode): void {
  const preamp = new GainNode(ctx, { gain: 1 });
  const filters = EQ_BANDS.map(
    (frequency, i) =>
      new BiquadFilterNode(ctx, {
        type: i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking',
        frequency,
        Q: 1.1,
        gain: 0,
      }),
  );
  source.connect(preamp);
  const out = filters.reduce<AudioNode>((prev, f) => prev.connect(f), preamp);
  out.connect(ctx.destination);
  // A tap for the visuals (playback/beat.ts): what's heard, after the EQ.
  const analyser = new AnalyserNode(ctx, { fftSize: 512, smoothingTimeConstant: 0.78 });
  out.connect(analyser);
  chain = { ctx, preamp, filters, analyser };
  applyEq();
}

/** The analyser over what's playing, once the graph exists; null before. */
export function getAnalyser(): AnalyserNode | null {
  return chain?.ctx.state === 'running' ? chain.analyser : null;
}

useFx.subscribe((s, prev) => {
  if (s.gains !== prev.gains || s.eqEnabled !== prev.eqEnabled || s.preamp !== prev.preamp) applyEq();
});
