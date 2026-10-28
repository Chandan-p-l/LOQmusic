import { Radio as RadioIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { searchSongs } from '@/data/music/api';
import type { Track } from '@/data/music/types';
import { useLibrary } from '@/state/library';
import { usePlayer } from '@/state/player';
import { toast } from '@/state/toast';

const STATIONS = [
  { name: 'Chill Lo-fi', query: 'lofi hip hop chill beats', colors: ['#6366f1', '#22d3ee'], emoji: '☕' },
  { name: 'Bollywood Hits', query: 'latest bollywood hits', colors: ['#f97316', '#e11d48'], emoji: '🎬' },
  { name: 'Pop Now', query: 'top pop hits 2026', colors: ['#ec4899', '#a855f7'], emoji: '✨' },
  { name: 'Hip-Hop Heat', query: 'hip hop rap hits', colors: ['#f59e0b', '#ef4444'], emoji: '🔥' },
  { name: 'Indie Vibes', query: 'indie pop vibes', colors: ['#14b8a6', '#84cc16'], emoji: '🌿' },
  { name: 'Workout', query: 'workout gym motivation songs', colors: ['#ef4444', '#7c3aed'], emoji: '💪' },
  { name: 'Romantic', query: 'romantic love songs', colors: ['#fb7185', '#f472b6'], emoji: '💖' },
  { name: 'Punjabi', query: 'punjabi hits', colors: ['#eab308', '#f97316'], emoji: '🥁' },
  { name: 'EDM & Dance', query: 'edm dance hits', colors: ['#06b6d4', '#8b5cf6'], emoji: '🎧' },
  { name: 'Rock Classics', query: 'classic rock anthems', colors: ['#64748b', '#dc2626'], emoji: '🎸' },
  { name: 'Jazz Lounge', query: 'smooth jazz lounge', colors: ['#a16207', '#1e3a8a'], emoji: '🎷' },
  { name: 'Focus', query: 'deep focus instrumental music', colors: ['#0ea5e9', '#1e293b'], emoji: '🧠' },
  { name: 'K-Pop', query: 'kpop hits', colors: ['#f472b6', '#60a5fa'], emoji: '💫' },
  { name: 'Sleep', query: 'calm sleep music piano', colors: ['#312e81', '#0f172a'], emoji: '🌙' },
  { name: 'Retro 90s', query: '90s hits', colors: ['#d946ef', '#f59e0b'], emoji: '📼' },
  { name: 'Devotional', query: 'devotional bhajan songs', colors: ['#f97316', '#facc15'], emoji: '🪔' },
];

/** Plays [seed] with AutoPlay on: YouTube Music's radio carries on from it, endlessly. */
function startRadio(seed: Track, title: string) {
  const player = usePlayer.getState();
  if (!player.autoplay) player.setAutoplay(true);
  player.playTrack(seed, { title, type: 'radio' });
  toast(`Tuning in to ${title} 📻`);
}

/** Radio: stations by mood and genre, and one made from the listener's own taste. */
export default function RadioPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const liked = useLibrary((s) => s.liked);
  const history = useLibrary((s) => s.history);
  const name = useLibrary((s) => s.profile?.name);

  const tune = async (station: (typeof STATIONS)[number]) => {
    setBusy(station.name);
    try {
      const songs = await searchSongs(station.query);
      const seed = songs[Math.floor(Math.random() * Math.min(5, songs.length))];
      if (seed) startRadio(seed, `${station.name} Radio`);
      else toast('That station is quiet right now. Try another.');
    } catch {
      toast('Couldn’t tune in. Check your connection.');
    } finally {
      setBusy(null);
    }
  };

  const pool = [...liked, ...history.map((h) => h.track)];
  const personal = () => {
    const seed = pool[Math.floor(Math.random() * pool.length)];
    if (seed) startRadio(seed, `${name ?? 'Your'}’s Station`);
  };

  return (
    <div className="px-(--body-gutter) pt-8 max-sm:pt-4">
      <p className="type-[600_14px/18px] text-secondary">Endless music, no skipping limits</p>
      <h1 className="type-[800_34px/40px] tracking-[-0.02em]">Radio</h1>

      <button
        className="glass mt-7 flex w-full items-center gap-5 overflow-hidden rounded-[28px] p-6 text-start transition-transform active:translate-y-0.5 disabled:opacity-50"
        disabled={pool.length === 0}
        onClick={personal}
      >
        <span className="btn-3d-key size-16 shrink-0 rounded-[20px]">
          <Sparkles size={28} />
        </span>
        <span className="min-w-0">
          <span className="block type-[800_22px/28px]">{name ? `${name}’s Station` : 'Your Station'}</span>
          <span className="block type-[500_14px/20px] text-secondary">
            {pool.length ? 'A never-ending mix that starts from songs you love.' : 'Like or play a few songs, and your own station appears here.'}
          </span>
        </span>
      </button>

      <h2 className="mt-10 mb-4 type-[700_22px/28px]">Stations</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {STATIONS.map((s) => (
          <li key={s.name}>
            <button
              className="relative flex aspect-[4/3] w-full flex-col justify-between overflow-hidden rounded-[24px] border border-[#ffffff2a] p-4 text-start text-white shadow-[inset_0_1px_0_#fff5,0_4px_0_#0007,0_14px_30px_#0006] transition-transform active:translate-y-1 disabled:opacity-60"
              style={{ background: `linear-gradient(180deg,#ffffff2e,#ffffff00 50%), linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})` }}
              disabled={busy !== null}
              onClick={() => void tune(s)}
            >
              <span className="text-[34px] leading-none drop-shadow-[0_4px_8px_#0006]">{s.emoji}</span>
              <span>
                <span className="block type-[800_17px/22px]">{s.name}</span>
                <span className="flex items-center gap-1 type-[600_11px/14px] opacity-80">
                  <RadioIcon size={12} /> {busy === s.name ? 'Tuning in…' : 'Radio'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
