import { X } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Segmented } from '@/components/loq/Segmented';
import { useUi } from '@/state/ui';
import { UpNext } from './UpNext';

// am-lyrics is large; it loads the first time the panel opens.
const LyricsPanel = lazy(() => import('./LyricsPanel').then((m) => ({ default: m.LyricsPanel })));

/** Up Next / Lyrics, a glass column sliding in over the right rail. */
export function SidePanel() {
  const panel = useUi((s) => s.sidePanel);
  const fullScreen = useUi((s) => s.fullScreen);
  const { toggleSidePanel, closeSidePanel } = useUi.getState();
  // Hidden under the full-screen player, which has its own: one am-lyrics at a time.
  if (!panel || fullScreen) return null;

  return (
    <aside
      className="glass-thick fixed top-3 right-3 bottom-[calc(var(--dock-height)+28px)] z-(--z-web-chrome) flex w-(--side-panel-width) animate-slide-in flex-col overflow-hidden rounded-[28px] max-sm:inset-x-2 max-sm:top-[calc(var(--mobile-top-bar-height)+16px)] max-sm:bottom-[150px] max-sm:w-auto"
      aria-label={panel === 'up-next' ? 'Up Next' : 'Lyrics'}
    >
      <div className="flex items-center gap-2 p-3">
        <Segmented
          className="flex-1"
          value={panel}
          options={[
            { value: 'lyrics', label: 'Lyrics' },
            { value: 'up-next', label: 'Up Next' },
          ]}
          onChange={(p) => panel !== p && toggleSidePanel(p)}
        />
        <button className="btn-3d size-9 rounded-full" aria-label="Close" onClick={closeSidePanel}>
          <X size={16} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {panel === 'up-next' ? (
          <UpNext />
        ) : (
          <Suspense fallback={null}>
            <LyricsPanel />
          </Suspense>
        )}
      </div>
    </aside>
  );
}
