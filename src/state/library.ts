import { create } from 'zustand';
import type { MusicItem, Track } from '@/data/music/types';

/**
 * LOQmusic's library, kept in this browser: no account, so the listener's
 * name, likes, playlists, saved albums, followed artists and history all live
 * in localStorage. This stands in for the YouTube Music library BitChord
 * reads when signed in.
 */

export interface Profile {
  name: string;
  /** Index into AVATAR_GRADIENTS. */
  avatar: number;
  joinedAt: number;
}

export interface LocalPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  track: Track;
  playedAt: number;
}

interface LibraryState {
  profile: Profile | null;
  liked: Track[];
  playlists: LocalPlaylist[];
  albums: MusicItem[];
  artists: MusicItem[];
  savedPlaylists: MusicItem[];
  history: HistoryEntry[];
  searches: string[];

  setProfile: (name: string, avatar?: number) => void;
  toggleLike: (track: Track) => void;
  isLiked: (videoId: string) => boolean;
  createPlaylist: (name: string, tracks?: Track[], description?: string) => string;
  renamePlaylist: (id: string, name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, tracks: Track[]) => void;
  removeFromPlaylist: (id: string, index: number) => void;
  movePlaylistTrack: (id: string, from: number, to: number) => void;
  toggleSaved: (item: MusicItem) => void;
  isSaved: (id: string) => boolean;
  recordPlay: (track: Track) => void;
  clearHistory: () => void;
  rememberSearch: (query: string) => void;
  clearSearches: () => void;
  importData: (json: string) => void;
  exportData: () => string;
}

export const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#6366f1,#22d3ee)',
  'linear-gradient(135deg,#f97316,#f43f5e)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#eab308,#ef4444)',
  'linear-gradient(135deg,#14b8a6,#a3e635)',
];

const KEY = 'loqmusic:library';
const HISTORY_LIMIT = 300;
const SEARCH_LIMIT = 12;

type Persisted = Pick<
  LibraryState,
  'profile' | 'liked' | 'playlists' | 'albums' | 'artists' | 'savedPlaylists' | 'history' | 'searches'
>;

const EMPTY: Persisted = {
  profile: null,
  liked: [],
  playlists: [],
  albums: [],
  artists: [],
  savedPlaylists: [],
  history: [],
  searches: [],
};

function load(): Persisted {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Persisted>) };
  } catch {
    return EMPTY;
  }
}

function persist(state: LibraryState): void {
  const { profile, liked, playlists, albums, artists, savedPlaylists, history, searches } = state;
  try {
    localStorage.setItem(KEY, JSON.stringify({ profile, liked, playlists, albums, artists, savedPlaylists, history, searches }));
  } catch {
    // Storage full or blocked: the library still works for this visit.
  }
}

const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Which saved list an item belongs in. */
function shelfOf(item: MusicItem): 'albums' | 'artists' | 'savedPlaylists' {
  if (item.kind === 'artist') return 'artists';
  if (item.kind === 'album') return 'albums';
  return 'savedPlaylists';
}

export const useLibrary = create<LibraryState>()((set, get) => ({
  ...load(),

  setProfile(name, avatar) {
    const current = get().profile;
    set({
      profile: {
        name: name.trim(),
        avatar: avatar ?? current?.avatar ?? Math.floor(Math.random() * AVATAR_GRADIENTS.length),
        joinedAt: current?.joinedAt ?? Date.now(),
      },
    });
  },

  toggleLike(track) {
    const liked = get().liked;
    set({
      liked: liked.some((t) => t.videoId === track.videoId)
        ? liked.filter((t) => t.videoId !== track.videoId)
        : [{ ...track, index: null }, ...liked],
    });
  },

  isLiked: (videoId) => get().liked.some((t) => t.videoId === videoId),

  createPlaylist(name, tracks = [], description = '') {
    const id = newId();
    const now = Date.now();
    set({ playlists: [{ id, name: name.trim() || 'New Playlist', description, tracks, createdAt: now, updatedAt: now }, ...get().playlists] });
    return id;
  },

  renamePlaylist(id, name, description) {
    set({
      playlists: get().playlists.map((p) =>
        p.id === id ? { ...p, name: name.trim() || p.name, description: description ?? p.description, updatedAt: Date.now() } : p,
      ),
    });
  },

  deletePlaylist(id) {
    set({ playlists: get().playlists.filter((p) => p.id !== id) });
  },

  addToPlaylist(id, tracks) {
    set({
      playlists: get().playlists.map((p) => {
        if (p.id !== id) return p;
        const fresh = tracks.filter((t) => !p.tracks.some((have) => have.videoId === t.videoId));
        return { ...p, tracks: [...p.tracks, ...fresh.map((t) => ({ ...t, index: null }))], updatedAt: Date.now() };
      }),
    });
  },

  removeFromPlaylist(id, index) {
    set({
      playlists: get().playlists.map((p) =>
        p.id === id ? { ...p, tracks: p.tracks.filter((_, i) => i !== index), updatedAt: Date.now() } : p,
      ),
    });
  },

  movePlaylistTrack(id, from, to) {
    set({
      playlists: get().playlists.map((p) => {
        if (p.id !== id) return p;
        const tracks = [...p.tracks];
        const [moved] = tracks.splice(from, 1);
        if (moved) tracks.splice(to, 0, moved);
        return { ...p, tracks, updatedAt: Date.now() };
      }),
    });
  },

  toggleSaved(item) {
    const shelf = shelfOf(item);
    const list = get()[shelf];
    set({ [shelf]: list.some((i) => i.id === item.id) ? list.filter((i) => i.id !== item.id) : [item, ...list] } as Partial<LibraryState>);
  },

  isSaved(id) {
    const { albums, artists, savedPlaylists } = get();
    return [albums, artists, savedPlaylists].some((list) => list.some((i) => i.id === id));
  },

  recordPlay(track) {
    const history = get().history;
    // A replay within ten minutes moves the entry up rather than adding another.
    const recent = history[0];
    if (recent && recent.track.videoId === track.videoId && Date.now() - recent.playedAt < 10 * 60_000) return;
    set({ history: [{ track: { ...track, index: null }, playedAt: Date.now() }, ...history].slice(0, HISTORY_LIMIT) });
  },

  clearHistory: () => set({ history: [] }),

  rememberSearch(query) {
    const q = query.trim();
    if (!q) return;
    set({ searches: [q, ...get().searches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, SEARCH_LIMIT) });
  },

  clearSearches: () => set({ searches: [] }),

  exportData: () => {
    const { profile, liked, playlists, albums, artists, savedPlaylists, history, searches } = get();
    return JSON.stringify({ app: 'LOQmusic', version: 1, profile, liked, playlists, albums, artists, savedPlaylists, history, searches }, null, 2);
  },

  importData(json) {
    const data = JSON.parse(json) as Partial<Persisted> & { app?: string };
    if (data.app !== 'LOQmusic') throw new Error('That file isn’t a LOQmusic backup.');
    set({ ...EMPTY, ...data, profile: data.profile ?? get().profile });
  },
}));

useLibrary.subscribe((state) => persist(state));

/** "Good evening": the greeting for the hour. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
