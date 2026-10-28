import { Fragment } from 'react';
import { DeveloperLinks, InfoPage, InfoSection } from '@/components/loq/Info';
import { PrefetchLink } from '@/components/PrefetchLink';
import site from '@/site.json';

const FEATURES = [
  ['Play anything', 'Search any song, album, artist or playlist and play it straight away, with music videos too.'],
  ['Synced lyrics', 'Word-by-word lyrics from 12 providers, with a provider picker and translation.'],
  ['AutoMix', 'Beat-matched DJ transitions between songs, or a plain crossfade from 0 to 12 seconds.'],
  ['Sound', 'A 10-band equalizer with 14 presets and a preamp, speed from 0.5× to 2×, and a sleep timer.'],
  ['Radio', '16 genre and mood stations, plus a personal station built from the songs you like.'],
  ['Listen Together', 'Start a party, share the link, and everyone hears the same song at the same moment.'],
  ['Your library', 'Liked songs, your own playlists, saved albums, followed artists and history, with backup and restore.'],
  ['Everywhere', 'Layouts for phone, tablet and desktop, six colour themes and keyboard shortcuts.'],
];

/** Shown here and in index.html's FAQPage data; keep the two in step. */
const FAQ = [
  ['Is LOQmusic free?', 'Yes. LOQmusic is completely free, with no ads, no subscription and no sign-up. It runs in your web browser, so there’s nothing to install.'],
  ['Do I need an account?', 'No. LOQmusic only asks for a name to greet you by. Your liked songs, playlists and history are stored in your own browser, not on a server.'],
  ['Does LOQmusic work on phones?', 'Yes. LOQmusic has layouts for phones, tablets and desktops, and works in any modern browser on Android, iOS, Windows, macOS and Linux.'],
  ['Can I listen to music with friends?', 'Yes. Listen Together lets you start a party and share a link, so everyone hears the same song at the same moment.'],
  ['Who made LOQmusic?', `LOQmusic is a non-commercial portfolio project by developer ${site.developer.name}. It hosts no music and isn’t affiliated with YouTube, Google or any record label.`],
];

export default function AboutPage() {
  return (
    <InfoPage
      title="About LOQmusic"
      lead={
        <>
          LOQmusic is a free music streaming web app. Search and play any song in your browser, with synced lyrics,
          AutoMix DJ transitions, an equalizer and Listen Together. No sign-up, no ads, nothing to install.
        </>
      }
    >
      <InfoSection id="features" title="What it does">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 max-md:grid-cols-1">
          {FEATURES.map(([name, detail]) => (
            <div key={name}>
              <dt className="type-[700_15px/20px] text-primary">{name}</dt>
              <dd className="ms-0 mt-0.5">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6!">
          <PrefetchLink to="/home" className="btn-3d-key h-11 rounded-full px-6 type-[700_14px/18px]">
            Start listening
          </PrefetchLink>
        </p>
      </InfoSection>

      <InfoSection id="portfolio" title="A portfolio project">
        <p>
          LOQmusic was designed and built by <strong>{site.developer.name}</strong> as a personal portfolio project: a
          showcase of front-end engineering, audio processing and interface design. It’s non-commercial. It doesn’t
          sell anything, show ads, collect personal data or charge for features. Its playback engine comes from the open-source{' '}
          <a href="https://github.com/kushagrasinghx/BitChord" target="_blank" rel="noopener noreferrer" className="text-key hover:underline">
            BitChord
          </a>{' '}
          project (GPL-3.0).
        </p>
        <p>
          LOQmusic doesn’t host, upload or store any music. It’s a player for music that YouTube Music already makes
          publicly available, and it isn’t affiliated with, endorsed by or sponsored by YouTube, Google, Apple, Spotify,
          Musixmatch or any record label. Read the full{' '}
          <PrefetchLink to="/terms" className="text-key hover:underline">terms and disclaimer</PrefetchLink>.
        </p>
      </InfoSection>

      <InfoSection id="faq" title="Questions">
        {FAQ.map(([question, answer]) => (
          // Fragments, so only the first question sits flush with the top.
          <Fragment key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </Fragment>
        ))}
      </InfoSection>

      <InfoSection id="developer" title="The developer">
        <p className="mb-4">
          Want to see more of {site.developer.name}’s work, hire them, or just say hi? They’re here. And if LOQmusic has
          earned a place in your day, you can{' '}
          <PrefetchLink to="/support" className="text-key hover:underline">support the developer</PrefetchLink>.
        </p>
        <DeveloperLinks />
      </InfoSection>
    </InfoPage>
  );
}
