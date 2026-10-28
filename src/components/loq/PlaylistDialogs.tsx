import { ListMusic, Plus } from 'lucide-react';
import { useState } from 'react';
import { create } from 'zustand';
import { Artwork } from '@/components/music/Artwork';
import type { Track } from '@/data/music/types';
import { useLibrary } from '@/state/library';
import { toast } from '@/state/toast';
import { Dialog, inputClass } from './ui';

/** Which playlist dialog is open, so any button anywhere can open one. */
interface DialogState {
  adding: Track[] | null;
  creating: { tracks: Track[] } | null;
  renaming: string | null;
}

export const usePlaylistDialogs = create<DialogState>()(() => ({ adding: null, creating: null, renaming: null }));

export const openAddToPlaylist = (tracks: Track[]) => usePlaylistDialogs.setState({ adding: tracks });
export const openCreatePlaylist = (tracks: Track[] = []) => usePlaylistDialogs.setState({ creating: { tracks }, adding: null });
export const openRenamePlaylist = (id: string) => usePlaylistDialogs.setState({ renaming: id });

/** A playlist's cover: its first four artworks in a grid, or a gradient. */
export function PlaylistCover({ tracks, size, radius = 14 }: { tracks: Track[]; size: number; radius?: number }) {
  const arts = [...new Set(tracks.map((t) => t.thumbnail).filter((u): u is string => !!u))].slice(0, 4);
  if (arts.length < 4) {
    return arts[0] ? (
      <div style={{ width: size, height: size }}>
        <Artwork src={arts[0]} displayWidth={size} radius={`${radius}px`} />
      </div>
    ) : (
      <div
        className="grid place-items-center bg-[image:var(--accent-gradient)] text-white shadow-[inset_0_1px_0_#fff5]"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <ListMusic size={size * 0.38} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 overflow-hidden" style={{ width: size, height: size, borderRadius: radius }}>
      {arts.map((src) => (
        <Artwork key={src} src={src} displayWidth={size / 2} radius="0" />
      ))}
    </div>
  );
}

function CreateDialog({ tracks }: { tracks: Track[] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const close = () => usePlaylistDialogs.setState({ creating: null });
  const submit = () => {
    const id = useLibrary.getState().createPlaylist(name, tracks, description.trim());
    const playlist = useLibrary.getState().playlists.find((p) => p.id === id);
    toast(tracks.length ? `Added to ${playlist?.name}` : `Created ${playlist?.name}`);
    close();
  };
  return (
    <Dialog title="New Playlist" onClose={close}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input className={inputClass} placeholder="My playlist" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoFocus />
        <input
          className={inputClass}
          placeholder="Description (optional)"
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="btn-3d-key mt-2 h-12 rounded-[16px] type-[700_15px/20px]">
          Create{tracks.length ? ` with ${tracks.length === 1 ? 'this song' : `${tracks.length} songs`}` : ''}
        </button>
      </form>
    </Dialog>
  );
}

function AddDialog({ tracks }: { tracks: Track[] }) {
  const playlists = useLibrary((s) => s.playlists);
  const close = () => usePlaylistDialogs.setState({ adding: null });
  return (
    <Dialog title="Add to Playlist" onClose={close}>
      <button
        className="mb-2 flex w-full items-center gap-3 rounded-[16px] p-2 text-start hover:bg-quinary"
        onClick={() => openCreatePlaylist(tracks)}
      >
        <span className="btn-3d-key size-12 rounded-[14px]">
          <Plus size={22} />
        </span>
        <span className="type-[700_15px/20px]">New Playlist…</span>
      </button>
      <ul className="-mx-2 max-h-[50vh] overflow-y-auto">
        {playlists.map((p) => {
          const has = tracks.every((t) => p.tracks.some((x) => x.videoId === t.videoId));
          return (
            <li key={p.id}>
              <button
                className="flex w-full items-center gap-3 rounded-[16px] p-2 text-start hover:bg-quinary disabled:opacity-50"
                disabled={has}
                onClick={() => {
                  useLibrary.getState().addToPlaylist(p.id, tracks);
                  toast(`Added to ${p.name}`);
                  close();
                }}
              >
                <PlaylistCover tracks={p.tracks} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate type-[700_15px/20px]">{p.name}</span>
                  <span className="block type-[500_12px/16px] text-secondary">
                    {has ? 'Already added' : `${p.tracks.length} song${p.tracks.length === 1 ? '' : 's'}`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {playlists.length === 0 && <p className="px-2 py-4 text-center type-[500_13px/18px] text-secondary">No playlists yet. Make your first one.</p>}
    </Dialog>
  );
}

function RenameDialog({ id }: { id: string }) {
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === id));
  const [name, setName] = useState(playlist?.name ?? '');
  const [description, setDescription] = useState(playlist?.description ?? '');
  const close = () => usePlaylistDialogs.setState({ renaming: null });
  if (!playlist) return null;
  return (
    <Dialog title="Edit Playlist" onClose={close}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          useLibrary.getState().renamePlaylist(id, name, description.trim());
          close();
        }}
      >
        <input className={inputClass} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Description" value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" className="btn-3d-key mt-2 h-12 rounded-[16px] type-[700_15px/20px]">
          Save
        </button>
      </form>
    </Dialog>
  );
}

export function PlaylistDialogs() {
  const { adding, creating, renaming } = usePlaylistDialogs();
  return (
    <>
      {adding && <AddDialog tracks={adding} />}
      {creating && <CreateDialog tracks={creating.tracks} />}
      {renaming && <RenameDialog id={renaming} />}
    </>
  );
}
