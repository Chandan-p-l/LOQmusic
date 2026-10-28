import { Check, ChevronRight, Download, RotateCcw, Upload } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { Avatar, inputClass } from '@/components/loq/ui';
import { PrefetchLink } from '@/components/PrefetchLink';
import { useAppleSettings } from '@/data/apple/motionArt';
import { useParty } from '@/party/useParty';
import { EQ_BANDS, EQ_LIMIT_DB, EQ_PRESETS, SLEEP_CHOICES, SPEED_CHOICES, useFx } from '@/playback/audioFx';
import { AUTOMIX_BARS } from '@/playback/automix/choices';
import { ACCENTS, useLook } from '@/state/look';
import { AVATAR_GRADIENTS, useLibrary } from '@/state/library';
import { CROSSFADE_CHOICES, usePlayer } from '@/state/player';
import { toast } from '@/state/toast';
import { useSleepLeft } from '@/shell/controls';

const LyricsSettings = lazy(() => import('@/shell/LyricsSettings').then((m) => ({ default: m.LyricsSettings })));

function Section({ id, title, children, note }: { id?: string; title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section id={id} className="mt-9 scroll-mt-6">
      <h2 className="mb-3 px-1 type-[800_13px/16px] tracking-[0.1em] text-tertiary uppercase">{title}</h2>
      <div className="glass rounded-[26px] p-2">{children}</div>
      {note && <p className="mt-2 px-2 type-[500_12px/17px] text-tertiary">{note}</p>}
    </section>
  );
}

function Row({ label, detail, children }: { label: string; detail?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] px-4 py-3.5 [&+&]:border-t [&+&]:border-[#ffffff0d]">
      <div className="min-w-0">
        <p className="type-[700_14px/18px]">{label}</p>
        {detail && <p className="mt-0.5 type-[500_12px/16px] text-secondary">{detail}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** A glossy 3D switch. */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-8 w-14 rounded-full border border-[#ffffff1f] bg-[#00000059] shadow-[inset_0_2px_6px_#000a] transition-colors aria-checked:border-transparent aria-checked:bg-[image:var(--accent-gradient)]"
    >
      <span className="absolute top-1/2 left-1 size-6 -translate-y-1/2 rounded-full bg-gradient-to-b from-white to-[#d9d4e6] shadow-[0_2px_0_#0005,0_4px_8px_#0007] transition-transform duration-200 [[aria-checked=true]>&]:translate-x-6" />
    </button>
  );
}

/** A row of 3D segment buttons. */
function Segments<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={`h-9 rounded-full px-3.5 type-[700_12px/16px] ${o.value === value ? 'btn-3d-key' : 'btn-3d'}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Profile() {
  const profile = useLibrary((s) => s.profile);
  const [name, setName] = useState(profile?.name ?? '');
  const dirty = name.trim() && name.trim() !== profile?.name;
  return (
    <Section title="You">
      <div className="flex items-center gap-4 p-3 max-sm:flex-col max-sm:items-start">
        <Avatar size={64} />
        <form
          className="flex min-w-0 flex-1 gap-2 max-sm:w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (!dirty) return;
            useLibrary.getState().setProfile(name);
            toast(`Nice to meet you, ${name.trim()} 👋`);
          }}
        >
          <input className={inputClass} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
          <button className="btn-3d-key h-12 shrink-0 rounded-[16px] px-5 type-[700_14px/18px]" disabled={!dirty}>
            Save
          </button>
        </form>
      </div>
      <div className="flex flex-wrap gap-3 px-3 pb-3">
        {AVATAR_GRADIENTS.map((bg, i) => (
          <button
            key={bg}
            className="grid size-10 place-items-center rounded-full text-white shadow-[inset_0_1px_0_#fff6,0_3px_0_#0006] active:translate-y-0.5"
            style={{ background: bg }}
            aria-label={`Avatar colour ${i + 1}`}
            aria-pressed={profile?.avatar === i}
            onClick={() => profile && useLibrary.getState().setProfile(profile.name, i)}
          >
            {profile?.avatar === i && <Check size={16} strokeWidth={3} />}
          </button>
        ))}
      </div>
    </Section>
  );
}

function Appearance() {
  const look = useLook();
  return (
    <Section title="Appearance">
      <div className="px-4 py-3.5">
        <p className="type-[700_14px/18px]">Accent</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              className="flex flex-col items-center gap-1.5"
              aria-pressed={look.accent === a.id}
              onClick={() => look.setAccent(a.id)}
            >
              <span
                className="grid size-12 place-items-center rounded-[16px] text-white shadow-[inset_0_1px_0_#fff6,0_3px_0_#0006,0_8px_16px_#0006] transition-transform active:translate-y-0.5"
                style={{ background: a.swatch }}
              >
                {look.accent === a.id && <Check size={20} strokeWidth={3} />}
              </span>
              <span className="type-[600_11px/14px] text-secondary">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Row label="Song colours" detail="The whole app takes its colours from the song that’s playing.">
        <Switch label="Song colours" checked={look.songColours} onChange={look.setSongColours} />
      </Row>
      <Row label="Reactive visuals" detail="A spectrum ring and glows that move with the music.">
        <Switch label="Reactive visuals" checked={look.reactive} onChange={look.setReactive} />
      </Row>
      <Row label="Artwork colours" detail="Wash album and playlist pages in their cover’s colour.">
        <Switch label="Artwork colours" checked={look.artworkTint} onChange={look.setArtworkTint} />
      </Row>
      <Row label="Spinning records" detail="Turn the vinyl while a song plays.">
        <Switch label="Spinning records" checked={look.spinVinyl} onChange={look.setSpinVinyl} />
      </Row>
    </Section>
  );
}

function Playback() {
  const autoplay = usePlayer((s) => s.autoplay);
  const crossfade = usePlayer((s) => s.crossfadeSec);
  const automix = usePlayer((s) => s.automix);
  const bars = usePlayer((s) => s.automixBars);
  const nerd = usePlayer((s) => s.showNerdStats);
  const speed = useFx((s) => s.speed);
  const p = usePlayer.getState();
  return (
    <Section
      title="Playback"
      note={
        automix
          ? 'AutoMix reads each song’s tempo, key and phrases, then blends on the beat like a DJ. Based on AutoMix by David Finnegan (AGPL-3.0).'
          : undefined
      }
    >
      <Row label="AutoPlay" detail="When the queue ends, keep playing similar music.">
        <Switch label="AutoPlay" checked={autoplay} onChange={p.setAutoplay} />
      </Row>
      <div className="px-4 py-3.5">
        <p className="type-[700_14px/18px]">Crossfade</p>
        <p className="mt-0.5 mb-3 type-[500_12px/16px] text-secondary">Fade songs into each other, or let AutoMix DJ the transitions.</p>
        <Segments<number | 'automix'>
          value={automix ? 'automix' : crossfade}
          options={[...CROSSFADE_CHOICES.map((s) => ({ value: s as number | 'automix', label: s === 0 ? 'Off' : `${s}s` })), { value: 'automix', label: 'AutoMix ✨' }]}
          onChange={(v) => (v === 'automix' ? p.setAutomix(true) : p.setCrossfade(v))}
        />
      </div>
      {automix && (
        <div className="px-4 py-3.5">
          <p className="mb-3 type-[700_14px/18px]">Blend length</p>
          <Segments value={bars} options={AUTOMIX_BARS.map((b) => ({ value: b, label: `${b} bars` }))} onChange={p.setAutomixBars} />
        </div>
      )}
      <div className="px-4 py-3.5">
        <p className="mb-3 type-[700_14px/18px]">Playback speed</p>
        <Segments value={speed} options={SPEED_CHOICES.map((s) => ({ value: s, label: `${s}×` }))} onChange={useFx.getState().setSpeed} />
      </div>
      <Row label="Stats for Nerds" detail="Codec, bitrate, sample rate and AutoMix’s plan under the artist.">
        <Switch label="Stats for Nerds" checked={nerd} onChange={p.setShowNerdStats} />
      </Row>
    </Section>
  );
}

function Equalizer() {
  const fx = useFx();
  return (
    <Section id="equalizer" title="Equalizer" note="The EQ shapes everything you hear, crossfades and AutoMix blends included.">
      <Row label="Equalizer" detail={fx.eqEnabled ? `Preset: ${fx.preset}` : 'Off'}>
        <Switch label="Equalizer" checked={fx.eqEnabled} onChange={fx.setEqEnabled} />
      </Row>
      <div className="px-4 pb-2">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-2">
          {Object.keys(EQ_PRESETS).map((name) => (
            <button
              key={name}
              className={`h-9 shrink-0 rounded-full px-3.5 type-[700_12px/16px] ${fx.preset === name && fx.eqEnabled ? 'btn-3d-key' : 'btn-3d'}`}
              onClick={() => fx.setPreset(name)}
            >
              {name}
            </button>
          ))}
        </div>
        {/* The faders: vertical sliders on a dark console. */}
        <div
          className="mt-2 grid grid-cols-[repeat(11,minmax(0,1fr))] gap-1 rounded-[20px] bg-[#0000004d] px-2 pt-4 pb-3 shadow-[inset_0_2px_10px_#000a] data-[off=true]:opacity-50"
          data-off={!fx.eqEnabled}
        >
          {[...EQ_BANDS.map((hz, i) => ({ key: `b${i}`, label: hz >= 1000 ? `${hz / 1000}k` : String(hz), value: fx.gains[i] ?? 0, set: (v: number) => fx.setGain(i, v) })), { key: 'pre', label: 'Pre', value: fx.preamp, set: fx.setPreamp }].map((band) => (
            <label key={band.key} className="flex flex-col items-center gap-2">
              <span className="type-[700_10px/12px] tabular-nums text-secondary">
                {band.value > 0 ? '+' : ''}
                {Math.round(band.value)}
              </span>
              <input
                type="range"
                min={-EQ_LIMIT_DB}
                max={EQ_LIMIT_DB}
                step={0.5}
                value={band.value}
                onChange={(e) => band.set(Number(e.target.value))}
                className="loq-range h-32 w-1.5 [direction:rtl] [writing-mode:vertical-lr]"
                style={{ '--fill': `${((band.value + EQ_LIMIT_DB) / (2 * EQ_LIMIT_DB)) * 100}%`, background: `linear-gradient(0deg, var(--accent-1), var(--accent-2)) 0 100% / 100% var(--fill) no-repeat, rgba(255,255,255,.14)` } as React.CSSProperties}
                aria-label={`${band.label} Hz`}
              />
              <span className="type-[600_10px/12px] text-tertiary">{band.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button className="btn-3d h-9 gap-1.5 rounded-full !px-4 type-[600_12px/16px]" onClick={() => fx.setPreset('Flat')}>
            <span className="flex items-center gap-1.5">
              <RotateCcw size={13} /> Reset
            </span>
          </button>
        </div>
      </div>
    </Section>
  );
}

function SleepTimer() {
  const fx = useFx();
  const left = useSleepLeft();
  const videoId = usePlayer((s) => s.nowPlaying?.videoId ?? null);
  return (
    <Section title="Sleep Timer" note="The music fades out gently over the last few seconds.">
      <Row label="Stop playing" detail={left ? `In ${left}` : 'Off'}>
        {left && (
          <button className="btn-3d h-9 rounded-full !px-4 type-[700_12px/16px] text-red" onClick={fx.cancelSleep}>
            Turn off
          </button>
        )}
      </Row>
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {SLEEP_CHOICES.map((m) => (
            <button key={m} className="btn-3d h-9 rounded-full px-3.5 type-[700_12px/16px]" onClick={() => (fx.sleepIn(m), toast(`Sleeping in ${m} min 🌙`))}>
              {m < 60 ? `${m} min` : `${m / 60} hr`}
            </button>
          ))}
          <button className="btn-3d h-9 rounded-full px-3.5 type-[700_12px/16px]" onClick={() => (fx.sleepAfterTrack(videoId), toast('Stopping after this track 🌙'))}>
            End of track
          </button>
        </div>
      </div>
    </Section>
  );
}

function LyricsAndArt() {
  const [open, setOpen] = useState(false);
  const apple = useAppleSettings();
  return (
    <Section title="Lyrics & Artwork" note="Lyrics come from lrc.red, BiniLyrics, BetterLyrics, PaxSenix, LyricsPlus, SimpMusic, Unison, Megalobiz, KuGou, LRCLIB, Musixmatch and Genius.">
      <button className="flex w-full items-center justify-between rounded-[18px] px-4 py-3.5 text-start hover:bg-quinary" onClick={() => setOpen(true)}>
        <span>
          <span className="block type-[700_14px/18px]">Lyric sources</span>
          <span className="block type-[500_12px/16px] text-secondary">Order, sources, word-by-word timing</span>
        </span>
        <ChevronRight size={18} className="text-tertiary" />
      </button>
      <Row label="Artist art" detail="Artist pages take Apple Music’s photo, logo and colour.">
        <Switch label="Artist art" checked={apple.artistArt} onChange={apple.setArtistArt} />
      </Row>
      <Row label="Animated artwork" detail="Apple Music’s moving covers on album pages.">
        <Switch label="Animated artwork" checked={apple.motion} onChange={apple.setMotion} />
      </Row>
      {open && (
        <Suspense fallback={null}>
          <LyricsSettings onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </Section>
  );
}

function Together() {
  const party = useParty();
  return (
    <Section title="Listen Together">
      <PrefetchLink to="/together" className="flex items-center justify-between rounded-[18px] px-4 py-3.5 hover:bg-quinary">
        <span>
          <span className="block type-[700_14px/18px]">Listen Together</span>
          <span className="block type-[500_12px/16px] text-secondary">{party.code ? `In party ${party.code}` : 'Play in sync with friends, anywhere'}</span>
        </span>
        <ChevronRight size={18} className="text-tertiary" />
      </PrefetchLink>
    </Section>
  );
}

function YourData() {
  const file = useRef<HTMLInputElement>(null);
  return (
    <Section title="Your Data" note="Everything lives in this browser. Back it up to move it to another device.">
      <div className="flex flex-wrap gap-2 p-3">
        <button
          className="btn-3d h-11 gap-2 rounded-[14px] !px-4 type-[700_13px/16px]"
          onClick={() => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([useLibrary.getState().exportData()], { type: 'application/json' }));
            a.download = `loqmusic-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          <span className="flex items-center gap-2">
            <Download size={15} /> Back up library
          </span>
        </button>
        <button className="btn-3d h-11 gap-2 rounded-[14px] !px-4 type-[700_13px/16px]" onClick={() => file.current?.click()}>
          <span className="flex items-center gap-2">
            <Upload size={15} /> Restore backup
          </span>
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            void f.text().then((text) => {
              try {
                useLibrary.getState().importData(text);
                toast('Library restored ✨');
              } catch (error) {
                toast(error instanceof Error ? error.message : 'That file couldn’t be read.');
              }
            });
            e.target.value = '';
          }}
        />
        <button
          className="btn-3d h-11 rounded-[14px] !px-4 type-[700_13px/16px] text-red"
          onClick={() => {
            if (!confirm('Erase your name, likes, playlists and history from this browser?')) return;
            localStorage.removeItem('loqmusic:library');
            location.reload();
          }}
        >
          Reset everything
        </button>
      </div>
    </Section>
  );
}

const SHORTCUTS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['→ / ←', 'Seek 5 seconds'],
  ['Ctrl + → / ←', 'Next / previous song'],
  ['↑ / ↓', 'Volume'],
  ['M', 'Mute'],
  ['S', 'Shuffle'],
  ['R', 'Repeat'],
  ['L', 'Lyrics'],
  ['Q', 'Up Next'],
  ['F', 'Full-screen player'],
  ['H', 'Like the song'],
  ['/', 'Search'],
  ['Esc', 'Close'],
];

function Shortcuts() {
  return (
    <Section title="Keyboard Shortcuts">
      <ul className="grid grid-cols-2 gap-x-4 p-3 max-sm:grid-cols-1">
        {SHORTCUTS.map(([key, what]) => (
          <li key={key} className="flex items-center justify-between gap-3 py-1.5">
            <span className="type-[500_13px/17px] text-secondary">{what}</span>
            <kbd className="btn-3d rounded-[8px] px-2 py-0.5 type-[700_11px/14px]">{key}</kbd>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Settings: you, the look, how it plays, the EQ, the timer, lyrics, friends and your data. */
export default function SettingsPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  return (
    <div className="mx-auto max-w-[760px] px-(--body-gutter) pt-8 max-sm:pt-4">
      <h1 className="type-[800_34px/40px] tracking-[-0.02em]">Settings</h1>
      <Profile />
      <Appearance />
      <Playback />
      <Equalizer />
      <SleepTimer />
      <LyricsAndArt />
      <Together />
      <YourData />
      <Shortcuts />
      <p className="mt-10 text-center type-[500_12px/17px] text-tertiary">
        <PrefetchLink to="/about" className="hover:text-primary">About</PrefetchLink> ·{' '}
        <PrefetchLink to="/support" className="hover:text-primary">Support the developer</PrefetchLink> ·{' '}
        <PrefetchLink to="/terms" className="hover:text-primary">Terms, privacy &amp; disclaimer</PrefetchLink>
        <br />
        LOQmusic · A non-commercial portfolio project · Built on the BitChord engine · Not affiliated with YouTube or
        Google.
      </p>
    </div>
  );
}
