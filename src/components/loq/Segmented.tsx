/**
 * An iOS segmented control: a recessed glass track with a raised glass thumb
 * that slides to the chosen segment.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const at = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      role="tablist"
      className={`relative grid h-10 rounded-full bg-[#00000038] p-1 shadow-[inset_0_1px_3px_#0007,inset_0_0_0_0.5px_#ffffff14] ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        className="absolute top-1 bottom-1 left-1 rounded-full bg-[linear-gradient(180deg,#ffffff3d,#ffffff14)] shadow-[inset_1px_1px_0_#ffffff70,inset_0_0_0_0.5px_#ffffff30,0_4px_12px_#0005] backdrop-blur-[20px] transition-transform duration-[380ms] ease-[cubic-bezier(.3,1.35,.5,1)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${at * 100}%)` }}
        aria-hidden="true"
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className="relative z-1 rounded-full type-[700_13px/16px] text-secondary transition-colors aria-selected:text-primary"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
