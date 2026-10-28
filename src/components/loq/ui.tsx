import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PrefetchLink } from '@/components/PrefetchLink';
import { AVATAR_GRADIENTS, useLibrary } from '@/state/library';
import { useToasts } from '@/state/toast';

/** The listener's initial on their gradient. */
export function Avatar({ size = 40, className = '' }: { size?: number; className?: string }) {
  const profile = useLibrary((s) => s.profile);
  const initial = profile?.name.trim().charAt(0).toUpperCase() || '♪';
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full text-white shadow-[inset_0_1px_0_#fff6,0_4px_12px_#0006] ${className}`}
      style={{
        width: size,
        height: size,
        background: AVATAR_GRADIENTS[profile?.avatar ?? 0],
        font: `800 ${Math.round(size * 0.42)}px/1 var(--font-family)`,
      }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

/** "Top" over "Trending", with a See all link on the right (the references' section heads). */
export function SectionHead({
  over,
  title,
  to,
  action,
  className = '',
}: {
  over?: string;
  title: string;
  to?: string | null;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-(--body-gutter) mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {over && <p className="type-[500_13px/16px] text-secondary">{over}</p>}
        <h2 className="truncate type-[700_26px/32px] tracking-[-0.01em]">{title}</h2>
      </div>
      {action}
      {to && (
        <PrefetchLink to={to} className="shrink-0 pb-1 type-[600_12px/16px] text-secondary hover:text-primary">
          See all
        </PrefetchLink>
      )}
    </div>
  );
}

/** A round 3D icon button. */
export function Btn3D({
  children,
  label,
  size = 40,
  onClick,
  pressed,
  disabled,
  className = '',
  title,
}: {
  children: ReactNode;
  label: string;
  size?: number;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      className={`btn-3d rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-label={label}
      title={title ?? label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** A centred glass dialog over a dimmed window. */
export function Dialog({
  title,
  onClose,
  children,
  width = 420,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  // Callers pass a fresh arrow each render; the listener reads the latest without re-running.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', onKey);
    // Focus lands once, on the first field (or the first button when there's none).
    (box.current?.querySelector<HTMLElement>('input') ?? box.current?.querySelector<HTMLElement>('button'))?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return createPortal(
    <div
      className="fixed inset-0 z-(--z-modal) grid animate-fade place-items-center bg-[#05030a99] p-4 backdrop-blur-[6px]"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={box}
        role="dialog"
        aria-label={title}
        className="glass-thick w-full animate-zoom rounded-[28px] p-6"
        style={{ maxWidth: width }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="type-[700_20px/26px]">{title}</h2>
          <Btn3D label="Close" size={32} onClick={onClose}>
            <X size={16} />
          </Btn3D>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export const inputClass =
  'h-12 w-full rounded-[16px] border border-[#ffffff1f] bg-[#00000040] px-4 type-[500_15px/20px] text-primary shadow-[inset_0_2px_6px_#0006] placeholder:text-tertiary focus:border-[rgba(var(--accent-2-rgb),.6)] focus:outline-none';

/** The glass toasts along the bottom. */
export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--dock-height)+28px)] z-(--z-modal) flex flex-col items-center gap-2 px-4 max-sm:bottom-[150px]">
      {toasts.map((t) => (
        <div key={t.id} className="glass-thick animate-toast rounded-full px-5 py-2.5 type-[600_13px/18px]" role="status">
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/** "3 min ago", for the history. */
export function timeAgo(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(at).toLocaleDateString();
}
