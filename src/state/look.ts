import { create } from 'zustand';

/** Appearance settings: the accent colour and how much the backdrop moves. */

export const ACCENTS = [
  { id: 'aurora', label: 'Aurora', swatch: 'linear-gradient(135deg,#a855f7,#ec4899)' },
  { id: 'crimson', label: 'Crimson', swatch: 'linear-gradient(135deg,#ff2d55,#ff6b3d)' },
  { id: 'mint', label: 'Mint', swatch: 'linear-gradient(135deg,#2dd4bf,#fb923c)' },
  { id: 'ocean', label: 'Ocean', swatch: 'linear-gradient(135deg,#3b82f6,#22d3ee)' },
  { id: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { id: 'lime', label: 'Lime', swatch: 'linear-gradient(135deg,#84cc16,#22c55e)' },
] as const;

export type Accent = (typeof ACCENTS)[number]['id'];

interface LookState {
  accent: Accent;
  /** Tint the window from the playing song's artwork. */
  artworkTint: boolean;
  /** Spin the record in the players. */
  spinVinyl: boolean;
  /** Recolour the app from the playing song's artwork (playback/songTheme.ts). */
  songColours: boolean;
  /** Glows and the spectrum ring that move with the music (playback/beat.ts). */
  reactive: boolean;
  setAccent: (accent: Accent) => void;
  setArtworkTint: (on: boolean) => void;
  setSpinVinyl: (on: boolean) => void;
  setSongColours: (on: boolean) => void;
  setReactive: (on: boolean) => void;
}

const KEY = 'loqmusic:look';

type Saved = Pick<LookState, 'accent' | 'artworkTint' | 'spinVinyl' | 'songColours' | 'reactive'>;

function load(): Saved {
  const fallback: Saved = { accent: 'aurora', artworkTint: true, spinVinyl: true, songColours: true, reactive: true };
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as object) };
  } catch {
    return fallback;
  }
}

function apply(accent: Accent) {
  if (accent === 'aurora') delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = accent;
}

export const useLook = create<LookState>()((set) => ({
  ...load(),
  setAccent: (accent) => set({ accent }),
  setArtworkTint: (artworkTint) => set({ artworkTint }),
  setSpinVinyl: (spinVinyl) => set({ spinVinyl }),
  setSongColours: (songColours) => set({ songColours }),
  setReactive: (reactive) => set({ reactive }),
}));

apply(useLook.getState().accent);
useLook.subscribe((s) => {
  apply(s.accent);
  try {
    const { accent, artworkTint, spinVinyl, songColours, reactive } = s;
    localStorage.setItem(KEY, JSON.stringify({ accent, artworkTint, spinVinyl, songColours, reactive }));
  } catch {
    // Not remembered; applies for this visit.
  }
});
