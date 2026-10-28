import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLibrary } from '@/state/library';
import { getAudio, usePlayer } from '@/state/player';
import { toast } from '@/state/toast';
import { useUi } from '@/state/ui';

/** Typing in a field shouldn't trigger the player. */
function typing(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName);
}

function focusSearch(navigate: ReturnType<typeof useNavigate>) {
  const field = document.querySelector<HTMLInputElement>('input[type="search"]');
  if (field) return field.focus();
  navigate('/search');
  // The search page is lazy: focus its field once it has rendered (for up to 3 s).
  const started = performance.now();
  const attempt = () => {
    const field = document.querySelector<HTMLInputElement>('input[type="search"]');
    if (field) field.focus();
    else if (performance.now() - started < 3000) setTimeout(attempt, 50);
  };
  attempt();
}

/**
 * The web player's shortcuts, which BitChord matches (report §8): Space
 * play/pause; ⌘/Ctrl+→ / ← next/previous; ⌘/Ctrl+↑ / ↓ volume; ⌘/Ctrl+F or
 * "/" focuses search; Esc closes the full-screen player, else the side panel.
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey) return;
      const player = usePlayer.getState();
      const command = event.metaKey || event.ctrlKey;

      if (command && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault();
        return focusSearch(navigate);
      }
      if (typing(event.target)) return;

      if (event.key === ' ' && !command) {
        // A focused button already answers Space itself.
        if ((event.target as HTMLElement | null)?.closest('button, a, [role="slider"]')) return;
        event.preventDefault();
        return player.togglePlay();
      }
      if (event.key === '/' && !command) {
        event.preventDefault();
        return focusSearch(navigate);
      }
      if (event.key === 'Escape') {
        const ui = useUi.getState();
        // A menu or dialog over the player closes first, on its own.
        if ((event.target as HTMLElement | null)?.closest('[role="menu"], [role="dialog"]:not([data-full-screen])')) return;
        if (ui.fullScreen) ui.setFullScreen(false);
        else if (ui.sidePanel) ui.closeSidePanel();
        return;
      }
      if (!command && !event.shiftKey) {
        const ui = useUi.getState();
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowLeft': {
            const audio = getAudio();
            if (!audio) return;
            event.preventDefault();
            return player.seek(audio.currentTime + (event.key === 'ArrowRight' ? 5 : -5));
          }
          case 'ArrowUp':
            event.preventDefault();
            return player.setVolume(Math.min(1, player.volume + 0.05));
          case 'ArrowDown':
            event.preventDefault();
            return player.setVolume(Math.max(0, player.volume - 0.05));
          case 'm':
          case 'M':
            return player.toggleMute();
          case 's':
          case 'S':
            return player.toggleShuffle();
          case 'r':
          case 'R':
            return player.cycleRepeat();
          case 'l':
          case 'L':
            return ui.toggleSidePanel('lyrics');
          case 'q':
          case 'Q':
            return ui.toggleSidePanel('up-next');
          case 'f':
          case 'F':
            return player.nowPlaying && ui.setFullScreen(!ui.fullScreen);
          case 'h':
          case 'H': {
            const track = player.queue[player.index]?.track;
            if (!track) return;
            const liked = useLibrary.getState().isLiked(track.videoId);
            useLibrary.getState().toggleLike(track);
            return toast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs 💜');
          }
        }
        return;
      }
      if (!command) return;
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          return player.next();
        case 'ArrowLeft':
          event.preventDefault();
          return player.previous();
        case 'ArrowUp':
          event.preventDefault();
          return player.setVolume(player.volume + 0.1);
        case 'ArrowDown':
          event.preventDefault();
          return player.setVolume(player.volume - 0.1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}
