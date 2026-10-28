import { meshPalette, type Rgb } from '@/lib/meshPalette';
import { useLook } from '@/state/look';
import { usePlayer } from '@/state/player';

/**
 * Song colours: while a song plays, the app takes its accent and its ambient
 * light from the artwork, the way iOS tints the lock screen player. The two
 * most vivid, most different colours on the sleeve become the accent pair, and
 * deep versions of them light the aurora. With the setting off, or nothing
 * playing, the chosen accent theme shows again.
 */

type Hsl = [number, number, number];

function toHsl([r, g, b]: Rgb): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function toRgb([h, s, l]: Hsl): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as Rgb;
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/** The accent pair and the aurora from the sleeve's cells. */
export function themeFrom(cells: Rgb[]): { a1: Rgb; a2: Rgb; aurora: [Rgb, Rgb, Rgb] } {
  const hsl = cells.map(toHsl);
  // Vivid first: saturation, with a little weight for not being near black.
  const ranked = [...hsl].sort((x, y) => y[1] * (0.4 + y[2]) - x[1] * (0.4 + x[2]));
  const first = ranked[0] ?? [280, 0.7, 0.5];
  const second = ranked.find((c) => hueGap(c[0], first[0]) > 35 && c[1] > 0.2) ?? [(first[0] + 40) % 360, first[1], first[2]];
  // A grey sleeve still gets a colour: a gentle tint of its own hue.
  const vivid = ([h, s]: Hsl, l: number): Hsl => [h, Math.max(0.55, Math.min(0.95, s * 1.4)), l];
  const a2 = toRgb(vivid(first, 0.62));
  const a1 = toRgb(vivid(second, 0.58));
  const deep = (c: Hsl) => toRgb([c[0], Math.max(0.5, c[1]), 0.3]);
  const third = ranked[2] ?? second;
  return { a1, a2, aurora: [deep(second), deep(first), deep(third)] };
}

const PROPS = ['--accent-1', '--accent-2', '--accent-1-rgb', '--accent-2-rgb', '--aurora-a', '--aurora-b', '--aurora-c', '--accent-ink'];

function clear(): void {
  const root = document.documentElement.style;
  PROPS.forEach((p) => root.removeProperty(p));
}

function apply(cells: Rgb[]): void {
  const { a1, a2, aurora } = themeFrom(cells);
  const root = document.documentElement.style;
  const css = (c: Rgb) => `rgb(${c.join(',')})`;
  root.setProperty('--accent-1', css(a1));
  root.setProperty('--accent-2', css(a2));
  root.setProperty('--accent-1-rgb', a1.join(', '));
  root.setProperty('--accent-2-rgb', a2.join(', '));
  root.setProperty('--aurora-a', css(aurora[0]));
  root.setProperty('--aurora-b', css(aurora[1]));
  root.setProperty('--aurora-c', css(aurora[2]));
  // Dark text on a pale accent, white on the rest.
  const lum = (0.2126 * a2[0] + 0.7152 * a2[1] + 0.0722 * a2[2]) / 255;
  root.setProperty('--accent-ink', lum > 0.72 ? '#14101c' : '#ffffff');
}

/** Follows the playing song's artwork; returns the stop. */
export function startSongTheme(): () => void {
  let current: string | null = null;
  const sync = () => {
    const url = usePlayer.getState().nowPlaying?.artworkUrl ?? null;
    const on = useLook.getState().songColours;
    const want = on ? url : null;
    if (want === current) return;
    current = want;
    if (!want) return clear();
    meshPalette(want)
      .then((cells) => current === want && apply(cells))
      .catch(() => current === want && clear());
  };
  sync();
  const offPlayer = usePlayer.subscribe((s, prev) => s.nowPlaying?.artworkUrl !== prev.nowPlaying?.artworkUrl && sync());
  const offLook = useLook.subscribe((s, prev) => s.songColours !== prev.songColours && sync());
  return () => {
    offPlayer();
    offLook();
    clear();
  };
}
