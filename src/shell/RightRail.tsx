import { Bell, Moon } from 'lucide-react';
import { useState } from 'react';
import { SafeImg } from '@/components/loq/SafeImg';
import { Avatar, timeAgo } from '@/components/loq/ui';
import { Artwork } from '@/components/music/Artwork';
import { playTrack } from '@/components/music/play';
import { PrefetchLink } from '@/components/PrefetchLink';
import { greeting, useLibrary } from '@/state/library';
import { usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { useArtworkColor } from '@/lib/artworkColor';
import { sizedArtwork } from '@/lib/artwork';
import { Scrubber, Transport, useSleepLeft } from './controls';
import { NowPlayingNames } from './PlayerDock';

function ProfileCard() {
  const profile = useLibrary((s) => s.profile);
  const sleepLeft = useSleepLeft();
  return (
    <div className="flex items-center gap-3 border-b border-divider pb-5">
      <PrefetchLink to="/settings" className="relative" aria-label="Your profile and settings">
        <Avatar size={46} />
        <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-[#16121f] bg-green" />
      </PrefetchLink>
      <div className="min-w-0 flex-1">
        <p className="type-[500_11px/14px] text-tertiary">{greeting()},</p>
        <p className="truncate type-[800_16px/20px]">{profile?.name ?? 'Listener'}</p>
      </div>
      <PrefetchLink to="/settings" className="btn-3d size-10 rounded-full" aria-label="Sleep timer and settings" title={sleepLeft ? `Sleep in ${sleepLeft}` : 'Settings'}>
        {sleepLeft ? <Moon size={16} className="text-key" /> : <Bell size={16} />}
      </PrefetchLink>
    </div>
  );
}

function RecentlyPlayed() {
  const history = useLibrary((s) => s.history);
  const [now] = useState(() => Date.now());
  const seen = new Set<string>();
  const recent = history.filter((h) => !seen.has(h.track.videoId) && seen.add(h.track.videoId)).slice(0, 5);
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="type-[500_12px/15px] text-tertiary">Your</p>
          <h3 className="type-[800_20px/24px]">Recently Played</h3>
        </div>
        <PrefetchLink to="/library/history" className="pb-0.5 type-[600_11px/14px] text-secondary hover:text-primary">
          See all
        </PrefetchLink>
      </div>
      {recent.length === 0 ? (
        <p className="rounded-[16px] bg-quinary p-4 type-[500_12px/17px] text-secondary">Songs you play show up here, ready to play again.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {recent.map(({ track, playedAt }) => (
            <li key={track.videoId}>
              <button
                className="group flex w-full items-center gap-3 rounded-[14px] p-1.5 text-start transition-colors hover:bg-quinary"
                onClick={() => playTrack(track, null, { title: 'Recently Played', type: 'other' })}
              >
                <div className="relative size-11 shrink-0">
                  <Artwork src={track.thumbnail} displayWidth={44} radius="10px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate type-[700_13px/17px]">{track.title}</p>
                  <p className="truncate type-[500_11px/14px] text-secondary">{track.artists.map((a) => a.name).join(', ')}</p>
                </div>
                <span className="shrink-0 type-[500_10px/13px] text-tertiary">{timeAgo(playedAt, now)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The now-playing card: big artwork with the controls in a glass slab over its foot. */
function NowPlayingCard() {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const color = useArtworkColor(nowPlaying?.artworkUrl);
  const open = useUi((s) => s.setFullScreen);
  if (!nowPlaying) return null;
  return (
    <section
      className="relative mt-auto overflow-hidden rounded-[26px] border border-[#ffffff1f] shadow-[0_20px_50px_#0008]"
      style={{ background: color?.background }}
    >
      <button className="block w-full" aria-label="Open the full-screen player" onClick={() => open(true)}>
        <SafeImg src={nowPlaying.artworkUrl ? sizedArtwork(nowPlaying.artworkUrl, 300, 1) : null} className="aspect-square w-full object-cover" />
      </button>
      <div className="glass-thick absolute inset-x-2.5 bottom-2.5 rounded-[20px] px-4 pt-3 pb-3.5 text-center">
        <div className="flex justify-center [&_div]:justify-center">
          <NowPlayingNames />
        </div>
        <Scrubber className="mt-2" />
        <Transport size="sm" className="mt-1 [&>button:first-child]:hidden [&>button:last-child]:hidden" />
      </div>
    </section>
  );
}

/** The right-hand column on wide screens. */
export function RightRail() {
  return (
    <aside
      className="glass fixed top-3 right-3 bottom-3 z-[calc(var(--z-web-chrome)-2)] hidden w-[calc(var(--rail-width)-12px)] flex-col overflow-y-auto rounded-[28px] p-5 scrollbar-none xl:flex"
      aria-label="Your corner"
    >
      <ProfileCard />
      <RecentlyPlayed />
      <div className="mt-5 flex flex-1 flex-col">
        <NowPlayingCard />
      </div>
    </aside>
  );
}
