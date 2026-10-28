import { Clock3, Disc3, Heart, ListMusic, Mic2, Play, Plus, Shuffle, Trash2 } from 'lucide-react';
import { Navigate, useParams } from 'react-router';
import { ChartTable } from '@/components/loq/ChartTable';
import { openCreatePlaylist, PlaylistCover } from '@/components/loq/PlaylistDialogs';
import { timeAgo } from '@/components/loq/ui';
import { CircleLockup, SquareLockup } from '@/components/music/Lockups';
import { playList, shuffleList } from '@/components/music/play';
import { PrefetchLink } from '@/components/PrefetchLink';
import type { MusicItem, Track } from '@/data/music/types';
import { useLibrary } from '@/state/library';
import { toast } from '@/state/toast';

const SECTIONS = {
  liked: { title: 'Liked Songs', icon: Heart, blurb: 'Every song you’ve hearted.' },
  albums: { title: 'Albums', icon: Disc3, blurb: 'Albums you’ve saved.' },
  artists: { title: 'Artists', icon: Mic2, blurb: 'Artists you follow.' },
  playlists: { title: 'Playlists', icon: ListMusic, blurb: 'Yours, and the ones you’ve saved.' },
  history: { title: 'History', icon: Clock3, blurb: 'What you’ve played, newest first.' },
} as const;

type Section = keyof typeof SECTIONS;

function Header({ section, count, tracks }: { section: Section; count: number; tracks?: Track[] }) {
  const { title, icon: Icon, blurb } = SECTIONS[section];
  const source = { title, type: 'library' as const };
  return (
    <header className="glass mx-(--body-gutter) mt-6 mb-8 flex items-center gap-6 rounded-[32px] p-7 max-md:flex-col max-md:items-start max-md:p-5">
      <div className="btn-3d-key size-28 shrink-0 rounded-[28px] max-md:size-20">
        <Icon size={44} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="type-[600_13px/16px] text-secondary">Library</p>
        <h1 className="type-[800_40px/46px] tracking-[-0.02em] max-md:type-[800_30px/36px]">{title}</h1>
        <p className="mt-1 type-[500_14px/20px] text-secondary">
          {blurb} · {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>
      {tracks && tracks.length > 0 && (
        <div className="flex gap-3">
          <button className="btn-3d size-12 rounded-full" aria-label="Shuffle" onClick={() => shuffleList(tracks, { source })}>
            <Shuffle size={18} />
          </button>
          <button className="btn-3d-key !inline-flex h-12 items-center gap-2 rounded-full px-6 type-[700_15px/20px]" onClick={() => playList(tracks, 0, { source })}>
            <Play size={16} fill="currentColor" /> Play
          </button>
        </div>
      )}
    </header>
  );
}

function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="glass mx-(--body-gutter) flex flex-col items-center gap-4 rounded-[28px] px-6 py-14 text-center">
      <p className="max-w-[360px] type-[500_15px/22px] text-secondary">{text}</p>
      {action}
    </div>
  );
}

function Grid({ items }: { items: MusicItem[] }) {
  return (
    <ul className="mx-(--body-gutter) grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-5 gap-y-7">
      {items.map((item) => (
        <li key={item.id}>{item.kind === 'artist' ? <CircleLockup item={item} /> : <SquareLockup item={item} />}</li>
      ))}
    </ul>
  );
}

function Playlists() {
  const playlists = useLibrary((s) => s.playlists);
  const saved = useLibrary((s) => s.savedPlaylists);
  return (
    <>
      <Header section="playlists" count={playlists.length + saved.length} />
      <ul className="mx-(--body-gutter) grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-5 gap-y-7">
        <li>
          <button className="group flex w-full flex-col text-start" onClick={() => openCreatePlaylist()}>
            <span className="grid aspect-square w-full place-items-center rounded-[18px] border-2 border-dashed border-[#ffffff2a] bg-[#ffffff08] text-secondary transition-colors group-hover:border-[rgba(var(--accent-2-rgb),.6)] group-hover:text-primary">
              <span className="btn-3d-key size-14 rounded-full">
                <Plus size={26} />
              </span>
            </span>
            <span className="mt-2.5 type-[700_13px/17px]">New Playlist</span>
          </button>
        </li>
        {playlists.map((p) => (
          <li key={p.id}>
            <PrefetchLink to={`/my/${p.id}`} className="group flex flex-col">
              <span className="block aspect-square w-full overflow-hidden rounded-[18px] shadow-[0_12px_30px_#0007] transition-transform group-hover:-translate-y-1">
                <span className="block size-full [&>*]:!size-full">
                  <PlaylistCover tracks={p.tracks} size={400} radius={18} />
                </span>
              </span>
              <span className="mt-2.5 truncate type-[700_13px/17px]">{p.name}</span>
              <span className="truncate type-[500_12px/16px] text-secondary">
                Playlist · {p.tracks.length} song{p.tracks.length === 1 ? '' : 's'}
              </span>
            </PrefetchLink>
          </li>
        ))}
        {saved.map((item) => (
          <li key={item.id}>
            <SquareLockup item={item} />
          </li>
        ))}
      </ul>
    </>
  );
}

function History() {
  const history = useLibrary((s) => s.history);
  const tracks = history.map((h) => h.track);
  const now = Date.now();
  return (
    <>
      <Header section="history" count={history.length} tracks={tracks} />
      {history.length ? (
        <>
          <div className="mx-(--body-gutter) mb-3 flex justify-end">
            <button
              className="btn-3d h-9 gap-2 rounded-full !px-4 type-[600_12px/16px]"
              onClick={() => {
                if (confirm('Clear your listening history?')) {
                  useLibrary.getState().clearHistory();
                  toast('History cleared');
                }
              }}
            >
              <span className="flex items-center gap-1.5">
                <Trash2 size={13} /> Clear history
              </span>
            </button>
          </div>
          <ChartTable tracks={tracks} source={{ title: 'History', type: 'library' }} numbered={false} trailing={(i) => timeAgo(history[i]!.playedAt, now)} />
        </>
      ) : (
        <Empty text="Nothing yet. Play a song and it’ll be remembered here." />
      )}
    </>
  );
}

/** Your library, kept in this browser: likes, saved albums and artists, playlists and history. */
export default function LibraryPage() {
  const section = useParams().section as Section | undefined;
  const liked = useLibrary((s) => s.liked);
  const albums = useLibrary((s) => s.albums);
  const artists = useLibrary((s) => s.artists);

  if (!section) return <LibraryHome />;
  switch (section) {
    case 'liked':
      return (
        <>
          <Header section="liked" count={liked.length} tracks={liked} />
          {liked.length ? (
            <ChartTable tracks={liked} source={{ title: 'Liked Songs', type: 'library' }} />
          ) : (
            <Empty text="Tap the ♡ on any song and it lands here." />
          )}
        </>
      );
    case 'albums':
      return (
        <>
          <Header section="albums" count={albums.length} />
          {albums.length ? <Grid items={albums} /> : <Empty text="Save an album with the + on its page." />}
        </>
      );
    case 'artists':
      return (
        <>
          <Header section="artists" count={artists.length} />
          {artists.length ? <Grid items={artists} /> : <Empty text="Follow an artist from their page." />}
        </>
      );
    case 'playlists':
      return <Playlists />;
    case 'history':
      return <History />;
    default:
      return <Navigate to="/library" replace />;
  }
}

/** /library on its own (the phone's Library tab): a card for each section. */
function LibraryHome() {
  const s = useLibrary();
  const counts = {
    liked: s.liked.length,
    albums: s.albums.length,
    artists: s.artists.length,
    playlists: s.playlists.length + s.savedPlaylists.length,
    history: s.history.length,
  };
  return (
    <div className="px-(--body-gutter) pt-8 max-sm:pt-4">
      <h1 className="type-[800_34px/40px] tracking-[-0.02em]">Your Library</h1>
      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {(Object.keys(SECTIONS) as Section[]).map((key) => {
          const { title, icon: Icon } = SECTIONS[key];
          return (
            <li key={key}>
              <PrefetchLink to={`/library/${key}`} className="glass flex items-center gap-4 rounded-[24px] p-4 transition-transform hover:-translate-y-0.5">
                <span className="btn-3d-key size-14 shrink-0 rounded-[18px]">
                  <Icon size={24} />
                </span>
                <span>
                  <span className="block type-[800_16px/20px]">{title}</span>
                  <span className="block type-[500_12px/16px] text-secondary">{counts[key]} items</span>
                </span>
              </PrefetchLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
