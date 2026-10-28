import { ChevronDown, Disc3, Expand, ListPlus, Minimize, Share2, Sparkles, Video } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { openAddToPlaylist } from '@/components/loq/PlaylistDialogs';
import { Segmented } from '@/components/loq/Segmented';
import { CoverBackdrop } from '@/components/loq/CoverBackdrop';
import { NeonStage } from '@/components/loq/NeonStage';
import { SafeImg } from '@/components/loq/SafeImg';
import { FavoriteButton } from '@/components/music/FavoriteButton';
import { TrackMenu } from '@/components/music/TrackMenu';
import { VideoSurface } from '@/components/music/VideoSurface';
import { sizedArtwork } from '@/lib/artwork';
import { useLook } from '@/state/look';
import { usePlayer } from '@/state/player';
import { toast } from '@/state/toast';
import { useUi } from '@/state/ui';
import { useHasVideo } from '@/state/video';
import { Scrubber, SoundMenu, Transport, VolumeSlider } from './controls';
import { NerdStats } from './NerdStats';
import { NowPlayingNames, useCurrentTrack } from './PlayerDock';
import { UpNext } from './UpNext';
import { VideoQuality } from './VideoQuality';

const LyricsPanel = lazy(() => import('./LyricsPanel').then((m) => ({ default: m.LyricsPanel })));

function useBrowserFullScreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    },
    () => document.fullscreenElement !== null,
  );
}

type Panel = 'lyrics' | 'queue';


/** Each row of the strip: the same height for every song, so the centre never shifts. */
const ROW = 100;
/** How long the wheel must rest on a song before it plays (so passing covers don't). */
const SETTLE_MS = 450;

/**
 * The queue as a wheel of covers, as on the reference: whichever song sits in
 * the middle opens into a glass card with its names. Scrolling rolls the next
 * cover into the centre (snapping one at a time), and the song the wheel comes
 * to rest on plays. A click on any cover rolls it to the centre and plays it.
 */
function QueueStrip() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const list = useRef<HTMLDivElement>(null);
  const from = Math.max(0, index - 12);
  const entries = queue.slice(from, index + 40);
  const [focus, setFocus] = useState(index);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set while the strip scrolls itself, so that scroll doesn't count as the listener's. */
  const auto = useRef(false);
  // Half the strip's height above the first row and below the last, so either end can sit in the middle.
  const [pad, setPad] = useState(0);
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => setPad(Math.max(0, el.clientHeight / 2 - ROW / 2));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const centre = useCallback(
    (at: number, smooth: boolean) => {
      const el = list.current;
      if (!el) return;
      auto.current = true;
      el.scrollTo({ top: (at - from) * ROW, behavior: smooth ? 'smooth' : 'instant' });
      setFocus(at);
      setTimeout(() => (auto.current = false), smooth ? 600 : 50);
    },
    [from],
  );

  // A new song: centre it (instantly the first time, gliding after).
  const first = useRef(true);
  useEffect(() => {
    if (!pad) return;
    centre(index, !first.current);
    first.current = false;
  }, [index, centre, pad]);

  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  const onScroll = () => {
    const el = list.current;
    if (!el) return;
    const centred = from + Math.round(el.scrollTop / ROW);
    setFocus(centred);
    if (auto.current) return;
    // Once the wheel comes to rest on another song, that song plays.
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      const target = from + Math.round((list.current?.scrollTop ?? 0) / ROW);
      const player = usePlayer.getState();
      if (target !== player.index && player.queue[target]) player.jumpTo(target);
    }, SETTLE_MS);
  };

  return (
    <div
      ref={list}
      onScroll={onScroll}
      className="scrollbar-none h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [mask-image:linear-gradient(180deg,transparent,#000_22%,#000_78%,transparent)]"
      style={{ paddingBlock: pad }}
      aria-label="Queue"
    >
      {entries.map((entry, i) => {
        const at = from + i;
        const { track } = entry;
        const focused = at === focus;
        const isPlaying = at === index;
        const distance = Math.abs(at - focus);
        return (
          <div key={entry.entryId} className="relative flex snap-center items-center" style={{ height: ROW }}>
            <button
              className="relative size-[80px] shrink-0 origin-left overflow-hidden rounded-[14px] shadow-[0_10px_26px_#0008] transition-[scale,opacity,border-radius] duration-500 ease-[cubic-bezier(.3,1.25,.5,1)] data-focused:rounded-l-[18px] data-focused:rounded-r-none"
              data-focused={focused || undefined}
              style={{ scale: focused ? 1.2 : 1, opacity: focused ? 1 : Math.max(0.35, 0.85 - distance * 0.1) }}
              title={`${track.title} · ${track.artists.map((a) => a.name).join(', ')}`}
              aria-label={`Play ${track.title}`}
              onClick={() => !isPlaying && usePlayer.getState().jumpTo(at)}
            >
              <SafeImg src={track.thumbnail ? sizedArtwork(track.thumbnail, 96, 1) : null} className="size-full object-cover" />
              <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_1px_0_#ffffff59,inset_0_0_0_0.5px_#ffffff2e]" />
            </button>
            {/* The names, in glass, beside the centred cover. */}
            <button
              className="glass-thick absolute left-[96px] flex h-[96px] w-[min(290px,calc(100%-96px))] flex-col justify-center rounded-r-[18px] px-4 text-start transition-[opacity,translate] duration-500 ease-[cubic-bezier(.3,1.25,.5,1)]"
              style={{ opacity: focused ? 1 : 0, translate: focused ? '0 0' : '-12px 0', pointerEvents: focused ? 'auto' : 'none' }}
              tabIndex={focused ? 0 : -1}
              aria-hidden={!focused}
              onClick={() => !isPlaying && usePlayer.getState().jumpTo(at)}
            >
              <span className="block truncate type-[500_13px/17px] text-secondary">{track.artists.map((a) => a.name).join(', ') || 'Unknown artist'}</span>
              <span className="block truncate type-[600_20px/26px] tracking-[-0.01em]">{track.title}</span>
              <span className="mt-0.5 flex items-center gap-1.5 truncate type-[500_12px/16px] text-tertiary">
                {isPlaying ? (
                  <>
                    <span className={`size-1.5 shrink-0 rounded-full bg-white ${playing ? 'shadow-[0_0_8px_#fff]' : 'opacity-50'}`} />
                    {playing ? 'Now playing' : 'Paused'}
                  </>
                ) : (
                  <>{track.album?.name ? `‹${track.album.name}›` : 'Tap to play'}</>
                )}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The cover as a disc turning inside a ring of liquid glass, with a black
 * centre and a label in the song's colour, as on the reference. The ring's own
 * glow breathes on the beat (drawn by the ring itself, so nothing behind the
 * glass changes and the refraction never has to redraw).
 */
function CoverDisc({ art, playing }: { art: string | null; playing: boolean }) {
  const spin = useLook((s) => s.spinVinyl);
  return (
    <div
      data-beat
      className="glass relative grid aspect-square w-[min(430px,44vh,32vw)] place-items-center rounded-full p-[14px] shadow-[0_0_calc(30px+var(--beat,0)*60px)_rgba(var(--accent-2-rgb),calc(0.25+var(--beat,0)*0.45)),0_30px_80px_#0009] max-md:w-[min(78vw,42vh)]"
    >
      <div
        className="relative size-full animate-[vinyl_24s_linear_infinite] overflow-hidden rounded-full shadow-[0_10px_40px_#000a] will-change-transform"
        style={{ animationPlayState: playing && spin ? 'running' : 'paused' }}
      >
        <SafeImg src={art} className="size-full object-cover" />
        {/* A soft sheen that stays put while the disc turns under it is drawn outside; this one turns with it. */}
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_20deg,transparent_0deg,#ffffff1f_30deg,transparent_70deg,transparent_190deg,#ffffff14_220deg,transparent_260deg)]" />
        {/* The record's centre: grooves, the label, the spindle hole. */}
        <div className="absolute top-1/2 left-1/2 size-[36%] -translate-1/2 rounded-full bg-[repeating-radial-gradient(circle,#0d0d10_0_1.4px,#1c1c22_1.8px_3px)] shadow-[0_0_0_2px_#0006,0_6px_18px_#000c]">
          <div className="absolute top-1/2 left-1/2 size-[44%] -translate-1/2 rounded-full bg-[image:var(--accent-gradient)] shadow-[inset_0_2px_6px_#fff6,inset_0_-3px_8px_#0004]">
            <div className="absolute top-1/2 left-1/2 size-[16%] -translate-1/2 rounded-full bg-[#0b0912]" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-[14px] rounded-full bg-[radial-gradient(120%_70%_at_30%_0%,#ffffff33,transparent_50%)]" />
    </div>
  );
}

/**
 * The full-screen player, a stage for one song: the queue as covers down the
 * left, the cover turning as a disc in a glass ring at the centre with its
 * names, the seek line and the controls beneath, and the lyrics flowing on
 * the right, all over the song's own cover, blurred to fill the room.
 */
export function FullScreenPlayer() {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const source = usePlayer((s) => s.queue[s.index]?.source?.title ?? null);
  const track = useCurrentTrack();
  const setFullScreen = useUi((s) => s.setFullScreen);
  const hasVideo = useHasVideo(nowPlaying?.videoId);
  const [showVideo, setShowVideo] = useState(false);
  const [panel, setPanel] = useState<Panel>('lyrics');
  const [mobileView, setMobileView] = useState<'player' | Panel>('player');
  const [neon, setNeon] = useState(false);
  const leaveNeon = useCallback(() => setNeon(false), []);
  const { pathname } = useLocation();
  const openedAt = useRef(pathname);
  const browserFullScreen = useBrowserFullScreen();
  const entered = useRef(false);

  // A name link went somewhere: step aside so the page shows.
  useEffect(() => {
    if (pathname !== openedAt.current) setFullScreen(false);
  }, [pathname, setFullScreen]);

  useEffect(() => {
    if (!nowPlaying) setFullScreen(false);
  }, [nowPlaying, setFullScreen]);

  useEffect(
    () => () => {
      if (entered.current && document.fullscreenElement) void document.exitFullscreen();
    },
    [],
  );

  if (!nowPlaying) return null;
  const video = hasVideo && showVideo;
  const art = nowPlaying.artworkUrl ? sizedArtwork(nowPlaying.artworkUrl, 560, 1) : null;

  const toggleBrowserFullScreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement.requestFullscreen().then(
        () => (entered.current = true),
        () => undefined,
      );
  };

  const share = () => {
    const url = `https://music.youtube.com/watch?v=${nowPlaying.videoId}`;
    if (navigator.share) void navigator.share({ title: nowPlaying.title, url }).catch(() => {});
    else void navigator.clipboard.writeText(url).then(() => toast('Link copied'));
  };

  const lyricsOrQueue = (
    <div className="flex min-h-0 flex-1 flex-col">
      {panel === 'queue' ? (
        <div className="glass-thick flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px]">
          <UpNext />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col [mask-image:linear-gradient(180deg,transparent,#000_12%,#000_86%,transparent)]">
          <Suspense fallback={null}>
            <LyricsPanel variant="stage" />
          </Suspense>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[calc(var(--z-contextual-menus)-2)] isolate flex animate-enter flex-col overflow-hidden bg-[#0b0912] text-primary"
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing"
      data-full-screen
    >
      <CoverBackdrop url={art} blur={34} dim={0.72} className="absolute inset-0 -z-1" />
      {neon && <NeonStage onExit={leaveNeon} />}

      <header className="relative z-1 flex items-center justify-between gap-3 px-8 pt-6 max-md:px-4 max-md:pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <button className="btn-3d size-10 rounded-full" aria-label="Close" title="Close (Esc)" onClick={() => setFullScreen(false)}>
            <ChevronDown size={20} />
          </button>
          <div className="min-w-0 max-md:hidden">
            <p className="type-[700_10px/12px] tracking-[0.18em] text-tertiary uppercase">Playing from</p>
            <p className="truncate type-[600_13px/17px]">{source ?? 'LOQmusic'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasVideo && (
            <button
              className="btn-3d size-10 rounded-full"
              aria-label={showVideo ? 'Show the cover' : 'Watch the music video'}
              title={showVideo ? 'Cover' : 'Music video'}
              aria-pressed={showVideo}
              onClick={() => setShowVideo((v) => !v)}
            >
              {showVideo ? <Disc3 size={17} /> : <Video size={17} />}
            </button>
          )}
          {video && <VideoQuality />}
          <button
            className="btn-3d h-10 gap-2 rounded-full !inline-flex items-center !px-4 type-[700_13px/16px]"
            aria-label="Neon mode"
            title="Neon mode: just the song, with neon light that moves to the music"
            onClick={() => setNeon(true)}
          >
            <Sparkles size={16} /> <span className="max-md:hidden">Neon</span>
          </button>
          {document.fullscreenEnabled && (
            <button className="btn-3d size-10 rounded-full max-md:hidden" aria-label="Browser full screen" onClick={toggleBrowserFullScreen}>
              {browserFullScreen ? <Minimize size={16} /> : <Expand size={16} />}
            </button>
          )}
          {/* The wordmark, light, top right, as the reference signs its stage. */}
          <span className="ml-3 type-[300_30px/34px] tracking-[0.04em] max-md:hidden">
            <span className="font-[700]">LOQ</span>music
          </span>
        </div>
      </header>

      {/* Phones: one view at a time. */}
      <div className="px-4 pt-3 md:hidden">
        <Segmented
          value={mobileView}
          options={[
            { value: 'player', label: 'Playing' },
            { value: 'lyrics', label: 'Lyrics' },
            { value: 'queue', label: 'Up Next' },
          ]}
          onChange={(v) => {
            setMobileView(v);
            if (v !== 'player') setPanel(v);
          }}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,400px)_minmax(0,1fr)_minmax(0,1fr)] gap-[clamp(16px,3vw,56px)] px-8 pb-6 max-lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] max-md:grid-cols-1 max-md:px-4 max-md:pb-4">
        {/* The queue. */}
        <aside className="min-h-0 max-lg:hidden">
          <QueueStrip />
        </aside>

        {/* The stage. */}
        <section className={`flex min-h-0 flex-col items-center justify-center gap-[clamp(14px,2.6vh,28px)] ${mobileView !== 'player' ? 'max-md:hidden' : ''}`}>
          {video ? (
            <div className="aspect-video w-full max-w-[720px] overflow-hidden rounded-[28px] bg-black shadow-[0_30px_80px_#000a]">
              <VideoSurface fit="contain" className="size-full" />
            </div>
          ) : (
            <CoverDisc art={art} playing={playing} />
          )}
          <div className="w-full max-w-[520px] text-center">
            <div className="flex justify-center [&_div]:justify-center [&>div>div:first-child]:type-[500_28px/34px] [&>div>div:first-child]:tracking-[0.02em]">
              <NowPlayingNames big />
            </div>
            <div className="mt-1 flex justify-center">
              <NerdStats />
            </div>
            <Scrubber inline className="mt-5" />
          </div>
          <div className="glass-thick flex items-center gap-2 rounded-full px-3 py-2.5 max-sm:flex-wrap max-sm:justify-center max-sm:rounded-[28px]">
            <FavoriteButton track={track} className="btn-3d size-10 rounded-full" size={17} />
            <button className="btn-3d size-10 rounded-full" aria-label="Add to a playlist" title="Add to a playlist" disabled={!track} onClick={() => track && openAddToPlaylist([track])}>
              <ListPlus size={17} />
            </button>
            <span className="mx-1 h-7 w-px bg-[#ffffff26] max-sm:hidden" />
            <Transport size="md" />
            <span className="mx-1 h-7 w-px bg-[#ffffff26] max-sm:hidden" />
            <SoundMenu size={40} placement="above-end" />
            <button className="btn-3d size-10 rounded-full" aria-label="Share" title="Share" onClick={share}>
              <Share2 size={16} />
            </button>
            {track && <TrackMenu track={track} placement="above-end" className="btn-3d size-10 rounded-full" />}
          </div>
          <VolumeSlider className="w-[220px] max-md:hidden" />
        </section>

        {/* The words, or what's next. */}
        <section className={`flex min-h-0 flex-col gap-3 ${mobileView === 'player' ? 'max-md:hidden' : ''}`}>
          <div className="flex justify-end max-md:hidden">
            <Segmented
              className="w-[240px]"
              value={panel}
              options={[
                { value: 'lyrics', label: 'Lyrics' },
                { value: 'queue', label: 'Up Next' },
              ]}
              onChange={setPanel}
            />
          </div>
          {lyricsOrQueue}
        </section>
      </div>
    </div>
  );
}
