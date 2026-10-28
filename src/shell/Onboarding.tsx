import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { LogoMark, Wordmark } from '@/components/icons/LogoMark';
import { Vinyl } from '@/components/loq/Vinyl';
import { inputClass } from '@/components/loq/ui';
import { PrefetchLink } from '@/components/PrefetchLink';
import { AVATAR_GRADIENTS, useLibrary } from '@/state/library';

const FEATURES = ['Every song on YouTube Music', 'Synced lyrics', 'AutoMix DJ transitions', '10-band equalizer', 'Listen Together'];

/**
 * The first visit: no sign-up, just a name to greet the listener by, and a
 * colour for their avatar. Saved in this browser only.
 */
export function Onboarding() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(() => Math.floor(Math.random() * AVATAR_GRADIENTS.length));
  const ready = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-(--z-modal) grid place-items-center overflow-y-auto bg-[#07050ccc] p-4 backdrop-blur-[18px]">
      {/* Records drifting in the aurora. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 animate-float opacity-60 blur-[1px]">
          <Vinyl artwork={null} size={340} playing />
        </div>
        <div className="absolute -right-20 -bottom-28 animate-float opacity-50 [animation-delay:-3s]">
          <Vinyl artwork={null} size={420} playing />
        </div>
      </div>

      <form
        className="glass-thick relative w-full max-w-[480px] animate-rise rounded-[36px] p-8 max-sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) useLibrary.getState().setProfile(name, avatar);
        }}
      >
        <div className="mb-7 flex items-center gap-3">
          <LogoMark size={48} />
          <Wordmark className="type-[800_30px/34px]" />
        </div>
        <h1 className="type-[800_32px/38px] tracking-[-0.02em] max-sm:type-[800_26px/32px]">
          Hey there 👋
          <br />
          <span className="text-gradient">What should we call you?</span>
        </h1>
        <p className="mt-3 type-[500_14px/20px] text-secondary">
          No account and no sign-up. Your name, likes and playlists stay right here in this browser.
        </p>

        <label className="mt-7 block">
          <span className="sr-only">Your name</span>
          <input
            className={`${inputClass} h-14 type-[600_17px/22px]`}
            placeholder="Your name"
            value={name}
            maxLength={40}
            autoFocus
            autoComplete="given-name"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="mt-5">
          <p className="mb-2.5 type-[600_12px/16px] text-secondary">Pick your colour</p>
          <div className="flex flex-wrap gap-3">
            {AVATAR_GRADIENTS.map((bg, i) => (
              <button
                key={bg}
                type="button"
                className="grid size-11 place-items-center rounded-full text-white shadow-[inset_0_1px_0_#fff6,0_3px_0_#0006,0_6px_14px_#0006] transition-transform active:translate-y-0.5 aria-pressed:ring-2 aria-pressed:ring-white aria-pressed:ring-offset-2 aria-pressed:ring-offset-[#140f1f]"
                style={{ background: bg }}
                aria-label={`Colour ${i + 1}`}
                aria-pressed={avatar === i}
                onClick={() => setAvatar(i)}
              >
                {avatar === i ? <Check size={18} strokeWidth={3} /> : <span className="type-[800_16px/1]">{name.trim().charAt(0).toUpperCase()}</span>}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={!ready} className="btn-3d-key mt-8 !flex h-14 w-full items-center justify-center gap-2 rounded-[18px] type-[800_16px/20px]">
          Start listening <ArrowRight size={18} strokeWidth={2.6} />
        </button>

        <ul className="mt-6 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <li key={f} className="rounded-full border border-[#ffffff1a] bg-[#ffffff0d] px-3 py-1 type-[600_11px/14px] text-secondary">
              {f}
            </li>
          ))}
        </ul>

        <p className="mt-5 type-[500_11px/16px] text-tertiary">
          A free, non-commercial portfolio project. By continuing you agree to the{' '}
          <PrefetchLink to="/terms" className="text-secondary underline hover:text-primary">terms and disclaimer</PrefetchLink>.
        </p>
      </form>
    </div>
  );
}
