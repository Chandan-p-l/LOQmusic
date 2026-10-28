import { useEffect } from 'react';
import { useLook } from '@/state/look';
import type { ArtworkColor } from './artworkColor';

/**
 * Washes the top of the scrolling page in the artwork's colour while a
 * detail page is open (AppShell draws it as a gradient over the aurora).
 * LOQmusic is always dark, so the labels on it keep their light colours.
 */
export function usePageTint(color: ArtworkColor | null) {
  const enabled = useLook((s) => s.artworkTint);
  useEffect(() => {
    const page = document.getElementById('scrollable-page');
    if (!page || !color || !enabled) return;
    page.style.setProperty('--page-tint', color.background);
    page.dataset.tint = 'dark';
    return () => {
      page.style.removeProperty('--page-tint');
      delete page.dataset.tint;
    };
  }, [color, enabled]);
}
