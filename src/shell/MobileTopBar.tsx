import { Menu as MenuIcon } from 'lucide-react';
import { LogoMark, Wordmark } from '@/components/icons/LogoMark';
import { Avatar } from '@/components/loq/ui';
import { PrefetchLink } from '@/components/PrefetchLink';
import { useUi } from '@/state/ui';

/** The phone's top bar: the drawer, the name, and the listener. */
export function MobileTopBar() {
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);
  return (
    <header className="glass fixed inset-x-2 top-2 z-[calc(var(--z-web-chrome)-1)] hidden h-(--mobile-top-bar-height) items-center justify-between rounded-[20px] px-2 max-sm:flex">
      <button className="btn-3d size-9 rounded-[12px]" aria-label="Open the menu" onClick={() => setDrawerOpen(true)}>
        <MenuIcon size={18} />
      </button>
      <PrefetchLink to="/home" className="flex items-center gap-2">
        <LogoMark size={26} />
        <Wordmark className="type-[800_18px/22px]" />
      </PrefetchLink>
      <PrefetchLink to="/settings" aria-label="Settings">
        <Avatar size={34} />
      </PrefetchLink>
    </header>
  );
}
