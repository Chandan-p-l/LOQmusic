import { Download, Pencil, Play, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ChartTable } from '@/components/loq/ChartTable';
import { openRenamePlaylist, PlaylistCover } from '@/components/loq/PlaylistDialogs';
import { inputClass } from '@/components/loq/ui';
import { Artwork } from '@/components/music/Artwork';
import { formatDuration } from '@/components/music/links';
import { playList, shuffleList, toTrack } from '@/components/music/play';
import { searchSongs } from '@/data/music/api';
import type { Track } from '@/data/music/types';
import { useLibrary } from '@/state/library';
import { toast } from '@/state/toast';

/** Search inside the playlist page, to add songs without leaving it. */
function AddSongs({ playlistId, have }: { playlistId: string; have: Set<string> }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[] | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section className="glass mx-(--body-gutter) mt-10 rounded-[28px] p-5">
      <h2 className="mb-3 type-[700_18px/24px]">Add songs</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!query.trim()) return;
          setBusy(true);
          void searchSongs(query.trim())
            .then(setResults)
            .catch(() => toast('Search failed. Try again.'))
            .finally(() => setBusy(false));
        }}
      >
        <input className={inputClass} placeholder="Search for songs to add" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn-3d-key h-12 shrink-0 rounded-[16px] px-5 type-[700_14px/18px]" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>
      {results && (
        <ul className="mt-3">
          {results.slice(0, 10).map((t) => (
            <li key={t.videoId} className="flex items-center gap-3 rounded-[14px] p-2 hover:bg-quinary">
              <div className="size-11 shrink-0">
                <Artwork src={t.thumbnail} displayWidth={44} radius="10px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate type-[700_14px/18px]">{t.title}</p>
                <p className="truncate type-[500_12px/16px] text-secondary">
                  {t.artists.map((a) => a.name).join(', ')} · {formatDuration(t.durationSec)}
                </p>
              </div>
              <button
                className="btn-3d size-9 rounded-full disabled:opacity-40"
                disabled={have.has(t.videoId)}
                aria-label={`Add ${t.title}`}
                onClick={() => {
                  useLibrary.getState().addToPlaylist(playlistId, [toTrack(t)]);
                  toast(`Added ${t.title}`);
                }}
              >
                <Plus size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One of the listener's own playlists: play, edit, reorder by removing, add songs, export. */
export default function MyPlaylistPage() {
  const id = useParams().id ?? '';
  const navigate = useNavigate();
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === id));
  if (!playlist) return <Navigate to="/library/playlists" replace />;
  const source = { title: playlist.name, type: 'playlist' as const, id };
  const total = playlist.tracks.reduce((sum, t) => sum + (t.durationSec ?? 0), 0);

  return (
    <>
      <header className="glass mx-(--body-gutter) mt-6 mb-8 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-7 rounded-[32px] p-7 max-md:grid-cols-1 max-md:justify-items-center max-md:p-5 max-md:text-center">
        <div className="size-[220px] shrink-0 overflow-hidden rounded-[24px] shadow-[0_20px_50px_#000a] max-md:size-[180px] [&>*]:!size-full">
          <PlaylistCover tracks={playlist.tracks} size={440} radius={24} />
        </div>
        <div className="min-w-0">
          <p className="type-[600_13px/16px] text-secondary">Your playlist</p>
          <h1 className="type-[800_42px/48px] tracking-[-0.02em] break-words max-md:type-[800_30px/36px]">{playlist.name}</h1>
          {playlist.description && <p className="mt-2 type-[500_14px/20px] text-secondary">{playlist.description}</p>}
          <p className="mt-1 type-[600_13px/18px] text-tertiary">
            {playlist.tracks.length} songs{total ? ` · ${Math.round(total / 60)} min` : ''}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 max-md:justify-center">
            <button
              className="btn-3d-key !inline-flex h-12 items-center gap-2 rounded-full px-6 type-[700_15px/20px]"
              disabled={!playlist.tracks.length}
              onClick={() => playList(playlist.tracks, 0, { source })}
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button className="btn-3d size-12 rounded-full" aria-label="Shuffle" disabled={!playlist.tracks.length} onClick={() => shuffleList(playlist.tracks, { source })}>
              <Shuffle size={18} />
            </button>
            <button className="btn-3d size-12 rounded-full" aria-label="Edit details" onClick={() => openRenamePlaylist(id)}>
              <Pencil size={17} />
            </button>
            <button
              className="btn-3d size-12 rounded-full"
              aria-label="Export as a text file"
              title="Export as a text file"
              disabled={!playlist.tracks.length}
              onClick={() => {
                const text = playlist.tracks
                  .map((t, i) => `${i + 1}. ${t.title} — ${t.artists.map((a) => a.name).join(', ')}  https://music.youtube.com/watch?v=${t.videoId}`)
                  .join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([`${playlist.name}\n\n${text}\n`], { type: 'text/plain' }));
                a.download = `${playlist.name}.txt`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              <Download size={17} />
            </button>
            <button
              className="btn-3d size-12 rounded-full hover:text-red"
              aria-label="Delete playlist"
              onClick={() => {
                if (!confirm(`Delete “${playlist.name}”?`)) return;
                useLibrary.getState().deletePlaylist(id);
                toast(`Deleted ${playlist.name}`);
                navigate('/library/playlists');
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </header>
      {playlist.tracks.length ? (
        <ChartTable tracks={playlist.tracks} source={source} onRemove={(i) => useLibrary.getState().removeFromPlaylist(id, i)} />
      ) : (
        <p className="mx-(--body-gutter) text-center type-[500_15px/22px] text-secondary">
          It’s empty in here. Add songs below, or from any song’s ⋯ menu.
        </p>
      )}
      <AddSongs playlistId={id} have={new Set(playlist.tracks.map((t) => t.videoId))} />
    </>
  );
}
