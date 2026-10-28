import { toast } from '@/state/toast';
import { useLibrary } from '@/state/library';
import { ensureAudioGraph, getAudio, usePlayer } from '@/state/player';
import { useLook } from '@/state/look';
import { useFx } from './audioFx';

/** How long the sleep timer fades the volume before it pauses. */
const SLEEP_FADE_MS = 12_000;

function applySpeed(): void {
  const audio = getAudio();
  const { speed } = useFx.getState();
  // AutoMix sets the rate itself while it beat-matches; speed only applies outside it.
  if (!audio || usePlayer.getState().automix) return;
  if (audio.playbackRate !== speed) audio.playbackRate = speed;
  audio.preservesPitch = true;
}

/**
 * LOQmusic's additions to the player, started once by the shell: speed,
 * the equalizer's graph, the sleep timer, and the listening history.
 * Returns the stop.
 */
export function startLoqRuntime(): () => void {
  const stops: (() => void)[] = [];

  // Speed: re-applied whenever the element in front changes or a track loads.
  stops.push(
    usePlayer.subscribe((s, prev) => {
      if (s.deck !== prev.deck || s.status !== prev.status) applySpeed();
    }),
    useFx.subscribe((s, prev) => {
      if (s.speed !== prev.speed) applySpeed();
    }),
  );

  // The Web Audio graph (the EQ, and the analyser the visuals read) needs a
  // gesture: built on the first play while either wants it, or when one is switched on.
  const graphIfEq = () => {
    const wanted = useFx.getState().eqEnabled || useLook.getState().reactive;
    if (wanted && getAudio()) void ensureAudioGraph().catch(() => {});
  };
  stops.push(
    usePlayer.subscribe((s, prev) => {
      if (s.status === 'playing' && prev.status !== 'playing') graphIfEq();
    }),
    useFx.subscribe((s, prev) => {
      if (s.eqEnabled && !prev.eqEnabled) graphIfEq();
    }),
    useLook.subscribe((s, prev) => {
      if (s.reactive && !prev.reactive) graphIfEq();
    }),
  );

  // History: a track counts once it has really started.
  stops.push(
    usePlayer.subscribe((s, prev) => {
      if (s.status !== 'playing' || (prev.status === 'playing' && prev.index === s.index)) return;
      const entry = s.queue[s.index];
      if (entry) useLibrary.getState().recordPlay(entry.track);
    }),
  );

  // Sleep timer: a clock, or "when this track ends".
  let restoreVolume: number | null = null;
  const stopForSleep = () => {
    const player = usePlayer.getState();
    if (player.status === 'playing') player.togglePlay();
    if (restoreVolume !== null) player.setVolume(restoreVolume);
    restoreVolume = null;
    useFx.getState().cancelSleep();
    toast('Sleep timer ended. Sweet dreams. 🌙');
  };
  const tick = setInterval(() => {
    const { sleep } = useFx.getState();
    if (sleep.kind !== 'at') return;
    const left = sleep.endsAt - Date.now();
    if (left <= 0) return stopForSleep();
    if (left < SLEEP_FADE_MS) {
      const player = usePlayer.getState();
      restoreVolume ??= player.volume;
      player.setVolume(restoreVolume * (left / SLEEP_FADE_MS));
    }
  }, 250);
  stops.push(() => clearInterval(tick));
  stops.push(
    usePlayer.subscribe((s, prev) => {
      const { sleep } = useFx.getState();
      if (sleep.kind !== 'end-of-track') return;
      const was = prev.nowPlaying?.videoId ?? null;
      const now = s.nowPlaying?.videoId ?? null;
      // The armed track gave way to the next one: stop there.
      if (was && now !== was && (sleep.videoId === null || sleep.videoId === was)) {
        usePlayer.getState().seek(0);
        stopForSleep();
      }
    }),
    useFx.subscribe((s, prev) => {
      // Cancelled mid-fade: give the volume back.
      if (s.sleep.kind === 'off' && prev.sleep.kind !== 'off' && restoreVolume !== null) {
        usePlayer.getState().setVolume(restoreVolume);
        restoreVolume = null;
      }
    }),
  );

  return () => stops.forEach((stop) => stop());
}
