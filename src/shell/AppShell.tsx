import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { CoverBackdrop } from '@/components/loq/CoverBackdrop';
import { PlaylistDialogs } from '@/components/loq/PlaylistDialogs';
import { sizedArtwork } from '@/lib/artwork';
import { startLiquidGlass } from '@/lib/liquidGlass';
import { usePageMeta } from '@/lib/pageMeta';
import { usePlayer } from '@/state/player';
import { Toasts } from '@/components/loq/ui';
import { resumeSession } from '@/party/listenTogether';
import { startPartySync } from '@/party/partySync';
import { startBeat } from '@/playback/beat';
import { startLoqRuntime } from '@/playback/loqRuntime';
import { startSongTheme } from '@/playback/songTheme';
import { useLibrary } from '@/state/library';
import '@/state/look';
import { useUi } from '@/state/ui';
import { MobileNav } from './MobileNav';
import { MobileTopBar } from './MobileTopBar';
import { Onboarding } from './Onboarding';
import { PlayerDock } from './PlayerDock';
import { RightRail } from './RightRail';
import { SidePanel } from './SidePanel';
import { Sidebar } from './Sidebar';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/** Pages a first visitor (or a search engine) can read before giving a name. */
const READABLE_UNNAMED = ['/about', '/support', '/terms'];

// It carries am-lyrics; loaded the first time it opens.
const FullScreenPlayer = lazy(() => import('./FullScreenPlayer').then((m) => ({ default: m.FullScreenPlayer })));

/**
 * LOQmusic's frame: the glass sidebar on the left, the page in the middle
 * over the aurora, the rail on the right on wide screens, and the floating
 * dock along the foot (the mini player and tabs on phones).
 */
export function AppShell() {
  useKeyboardShortcuts();
  usePageMeta();
  const { pathname } = useLocation();
  // Listen Together: pick a party back up after a reload, and keep the player in step with it.
  useEffect(() => {
    resumeSession();
    return startPartySync();
  }, []);
  // Speed, the equalizer, the sleep timer and the history.
  useEffect(() => startLoqRuntime(), []);
  // The song's colours across the app, and the pulse the glows follow.
  useEffect(() => startSongTheme(), []);
  useEffect(() => startBeat(), []);
  const fullScreen = useUi((s) => s.fullScreen);
  const named = useLibrary((s) => s.profile !== null);
  const artwork = usePlayer((s) => s.nowPlaying?.artworkUrl ?? null);
  // Edge refraction for every glass pane, in browsers that can draw it.
  useEffect(() => startLiquidGlass(), []);

  return (
    <div className="h-full">
      {/* Under the full-screen player nothing of the shell shows, so none of it is painted. */}
      <div className={fullScreen ? 'invisible' : undefined} aria-hidden={fullScreen || undefined} data-shell-hidden={fullScreen || undefined}>
      {/* The room the glass floats in: the playing song's cover, or the wallpaper. */}
      <CoverBackdrop url={artwork ? sizedArtwork(artwork, 560, 1) : null} blur={40} dim={0.5} className="fixed inset-0 -z-1" />
      <Sidebar />
      <MobileTopBar />
      <main
        id="scrollable-page"
        className="fixed inset-0 overflow-x-hidden overflow-y-auto pl-(--web-navigation-width) [scrollbar-gutter:stable] data-tint:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--page-tint)_75%,transparent)_0,transparent_620px)] xl:pr-(--rail-width) max-sm:pt-[calc(var(--mobile-top-bar-height)+8px)]"
      >
        <div className="min-h-full pb-[calc(var(--dock-height)+48px)] max-sm:pb-[170px]">
          <Outlet />
        </div>
      </main>
      <RightRail />
      <div className="pointer-events-none fixed right-3 bottom-3 left-[calc(var(--web-navigation-width)+12px)] z-[calc(var(--z-web-chrome)-1)] max-sm:hidden xl:right-[calc(var(--rail-width)+12px)]">
        <PlayerDock />
      </div>
      <MobileNav />
      <SidePanel />
      </div>
      {fullScreen && (
        <Suspense fallback={null}>
          <FullScreenPlayer />
        </Suspense>
      )}
      <PlaylistDialogs />
      <Toasts />
      {!named && !READABLE_UNNAMED.includes(pathname) && <Onboarding />}
    </div>
  );
}
