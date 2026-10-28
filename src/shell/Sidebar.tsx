import {
  Clock3,
  Compass,
  Disc3,
  Heart,
  HeartHandshake,
  Home,
  LayoutGrid,
  ListMusic,
  Mic2,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { openCreatePlaylist, PlaylistCover } from '@/components/loq/PlaylistDialogs';
import { Avatar } from '@/components/loq/ui';
import { LogoMark, Wordmark } from '@/components/icons/LogoMark';
import { PrefetchNavLink } from '@/components/PrefetchLink';
import { useParty } from '@/party/listenTogether';
import { useLibrary } from '@/state/library';
import { toast } from '@/state/toast';
import { useUi } from '@/state/ui';

const MENU = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/browse-all', label: 'Browse', icon: LayoutGrid },
  { to: '/radio', label: 'Radio', icon: Radio },
  { to: '/new', label: 'New Releases', icon: Sparkles },
];

const LIBRARY = [
  { to: '/library/liked', label: 'Liked Songs', icon: Heart },
  { to: '/library/albums', label: 'Albums', icon: Disc3 },
  { to: '/library/artists', label: 'Artists', icon: Mic2 },
  { to: '/library/playlists', label: 'Playlists', icon: ListMusic },
  { to: '/library/history', label: 'History', icon: Clock3 },
];

const navItem =
  'group relative flex h-10 items-center gap-3 rounded-nav px-3 type-[600_14px/18px] text-secondary transition-colors hover:bg-quinary hover:text-primary aria-[current=page]:bg-nav-selected aria-[current=page]:text-primary rail:justify-center rail:px-0';

function NavItem({ to, label, icon: Icon, trailing }: { to: string; label: string; icon: typeof Home; trailing?: ReactNode }) {
  const close = useUi((s) => s.setDrawerOpen);
  return (
    <PrefetchNavLink to={to} className={navItem} title={label} onClick={() => close(false)}>
      {/* The accent tick on the right, as on the reference's active item. */}
      <span className="absolute top-2 -right-[13px] bottom-2 hidden w-[3px] rounded-l-full bg-[image:var(--accent-gradient)] shadow-[0_0_10px_rgba(var(--accent-2-rgb),.8)] group-aria-[current=page]:block rail:-right-[11px]" />
      <span className="grid size-7 place-items-center rounded-[9px] group-aria-[current=page]:bg-[image:var(--accent-gradient)] group-aria-[current=page]:text-white group-aria-[current=page]:shadow-[inset_0_1px_0_#fff6,0_4px_10px_rgba(var(--accent-2-rgb),.45)]">
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <span className="truncate rail:hidden">{label}</span>
      {trailing && <span className="ml-auto rail:hidden">{trailing}</span>}
    </PrefetchNavLink>
  );
}

function Heading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between px-3 rail:justify-center rail:px-0">
      <h3 className="type-[700_11px/14px] tracking-[0.12em] text-tertiary uppercase rail:hidden">{children}</h3>
      {action}
    </div>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState('');
  return (
    <form
      className="relative rail:hidden"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-tertiary" />
      <input
        type="search"
        placeholder="Search…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => location.pathname !== '/search' && value === '' && navigate('/search')}
        className="h-11 w-full rounded-[14px] border border-[#ffffff14] bg-[#0000003a] pr-3 pl-10 type-[500_13px/16px] shadow-[inset_0_2px_5px_#0007] placeholder:text-tertiary focus:border-[rgba(var(--accent-2-rgb),.5)] focus:outline-none"
        aria-label="Search songs, artists, albums"
      />
    </form>
  );
}

function Playlists() {
  const playlists = useLibrary((s) => s.playlists);
  const close = useUi((s) => s.setDrawerOpen);
  return (
    <ul className="flex flex-col gap-0.5">
      {playlists.map((p) => (
        <li key={p.id} className="group/pl relative">
          <PrefetchNavLink
            to={`/my/${p.id}`}
            className={`${navItem} pr-9 rail:pr-0`}
            title={p.name}
            onClick={() => close(false)}
          >
            <span className="shrink-0">
              <PlaylistCover tracks={p.tracks} size={28} radius={8} />
            </span>
            <span className="truncate rail:hidden">{p.name}</span>
          </PrefetchNavLink>
          <button
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-[8px] text-tertiary opacity-0 transition-opacity group-hover/pl:opacity-100 hover:bg-quinary hover:text-red focus-visible:opacity-100 rail:hidden"
            aria-label={`Delete ${p.name}`}
            onClick={() => {
              if (confirm(`Delete “${p.name}”? This can’t be undone.`)) {
                useLibrary.getState().deletePlaylist(p.id);
                toast(`Deleted ${p.name}`);
              }
            }}
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
      {playlists.length === 0 && (
        <li className="px-3 type-[500_12px/16px] text-tertiary rail:hidden">Your playlists will live here.</li>
      )}
    </ul>
  );
}

/**
 * The glass sidebar: an icon rail on tablets, a drawer on phones. Menu,
 * Library and the listener's own playlists, then Listen Together, Settings
 * and who's listening at the foot.
 */
export function Sidebar() {
  const drawerOpen = useUi((s) => s.drawerOpen);
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);
  const profile = useLibrary((s) => s.profile);
  const inParty = useParty((s) => s.code !== null);

  return (
    <>
      {drawerOpen && <div className="fixed inset-0 z-(--z-web-chrome) animate-fade bg-scrim sm:hidden" onClick={() => setDrawerOpen(false)} />}
      <nav
        aria-label="Main"
        className="glass fixed top-3 bottom-3 left-3 z-(--z-web-chrome) flex w-[calc(var(--web-navigation-width)-12px)] flex-col overflow-hidden rounded-[28px] max-sm:w-[280px] max-sm:-translate-x-[calc(100%+20px)] max-sm:transition-transform max-sm:duration-300 data-[open=true]:max-sm:translate-x-0"
        data-open={drawerOpen}
      >
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5 rail:justify-center rail:px-0">
          <LogoMark size={34} />
          <Wordmark className="rail:hidden" />
        </div>
        <div className="px-4 rail:px-0">
          <SearchBox />
          <div className="hidden rail:block">
            <NavItem to="/search" label="Search" icon={Search} />
          </div>
        </div>
        <div className="scrollbar-none flex-1 overflow-y-auto px-4 pb-4 rail:px-2.5">
          <Heading>Menu</Heading>
          {MENU.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <Heading>Library</Heading>
          {LIBRARY.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <Heading
            action={
              <button
                className="btn-3d size-7 rounded-[9px]"
                aria-label="New playlist"
                title="New playlist"
                onClick={() => openCreatePlaylist()}
              >
                <Plus size={14} strokeWidth={2.6} />
              </button>
            }
          >
            Playlists
          </Heading>
          <Playlists />
        </div>
        <div className="border-t border-divider px-4 py-3 rail:px-2.5">
          <NavItem
            to="/together"
            label="Listen Together"
            icon={UsersRound}
            trailing={inParty ? <span className="size-2 rounded-full bg-green shadow-[0_0_8px_var(--systemGreen)]" /> : null}
          />
          <NavItem to="/support" label="Support" icon={HeartHandshake} />
          <NavItem to="/settings" label="Settings" icon={Settings} />
          <PrefetchNavLink
            to="/settings"
            className="mt-2 flex items-center gap-3 rounded-[16px] p-2 hover:bg-quinary rail:justify-center"
            title={profile?.name}
          >
            <Avatar size={36} />
            <div className="min-w-0 rail:hidden">
              <p className="truncate type-[700_13px/16px]">{profile?.name ?? 'Listener'}</p>
              <p className="type-[500_11px/14px] text-tertiary">LOQ Member</p>
            </div>
          </PrefetchNavLink>
        </div>
      </nav>
    </>
  );
}
