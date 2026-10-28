import { InfoPage, InfoSection } from '@/components/loq/Info';
import { PrefetchLink } from '@/components/PrefetchLink';
import site from '@/site.json';

const UPDATED = '28 October 2026';

const external = 'text-key hover:underline';

export default function TermsPage() {
  const { developer } = site;
  return (
    <InfoPage
      title="Terms, privacy & disclaimer"
      lead={
        <>
          The short version: LOQmusic is a free, non-commercial portfolio project. It hosts no music, keeps your
          library in your own browser, and comes with no guarantees. Last updated {UPDATED}.
        </>
      }
    >
      <InfoSection id="portfolio" title="1. A portfolio project">
        <p>
          LOQmusic (“the site”) is a personal portfolio and educational project made by {developer.name} (“the
          developer”) to demonstrate web development, audio and interface design skills. It isn’t a company, a
          business or a commercial service. It doesn’t sell anything, show ads, offer subscriptions or charge for
          features. Using it means you accept these terms; if you don’t, please don’t use it.
        </p>
      </InfoSection>

      <InfoSection id="disclaimer" title="2. No music is hosted here">
        <p>
          LOQmusic doesn’t host, upload, store, sell or distribute any music, videos, lyrics or artwork. Everything you
          play is fetched at the moment you ask for it from third-party services where it’s already publicly
          available, chiefly YouTube Music, and lyric providers. LOQmusic is only an interface for that content.
        </p>
        <p>
          <strong>
            LOQmusic isn’t affiliated with, endorsed by, sponsored by or connected to YouTube, Google, Apple, Spotify,
            Musixmatch, Discord, or any artist, record label or rights holder.
          </strong>{' '}
          Their names and logos are trademarks of their owners and appear only to describe where content comes from.
        </p>
      </InfoSection>

      <InfoSection id="copyright" title="3. Copyright and takedown requests">
        <p>
          All songs, recordings, lyrics, artwork, artist names and trademarks belong to their respective owners. The
          developer respects intellectual property. If you own rights in something reachable through LOQmusic and want
          it removed or blocked, or have any other concern, contact the developer through{' '}
          <a href={developer.linkedin} target="_blank" rel="noopener noreferrer" className={external}>LinkedIn</a>,{' '}
          <a href={developer.instagram} target="_blank" rel="noopener noreferrer" className={external}>Instagram</a> or{' '}
          <a href={developer.github} target="_blank" rel="noopener noreferrer" className={external}>GitHub</a> with
          the details, and it will be dealt with promptly. Because the content is served by the original platform,
          removing it there also removes it from LOQmusic.
        </p>
      </InfoSection>

      <InfoSection id="use" title="4. Using LOQmusic">
        <ul>
          <li>Use it for personal, non-commercial listening only.</li>
          <li>Don’t use it to download, copy, record or redistribute anyone’s content.</li>
          <li>Don’t attack, overload, scrape or try to break the site or its server.</li>
          <li>Follow the laws of your country and the terms of the services the content comes from.</li>
        </ul>
        <p>The developer may change, limit or shut down the site, or any part of it, at any time without notice.</p>
      </InfoSection>

      <InfoSection id="privacy" title="5. Privacy">
        <p>
          <strong>LOQmusic has no accounts and doesn’t collect personal data.</strong> The name you type in, your liked
          songs, playlists, saved albums, followed artists, history and settings are saved in your own browser’s
          storage and never sent to the developer. Clearing your browser’s site data deletes them.
        </p>
        <p>
          To play music, LOQmusic’s server passes your requests on to YouTube and the lyric providers. It doesn’t log
          or keep what you play. Those services, and Google Fonts, which the site’s typefaces load from, receive your
          requests under their own privacy policies. If you join Listen Together, your name and what the party is
          playing are shared with the others in that party through the party server.
        </p>
        <p>There are no ads, no analytics trackers and no cookies used to track you.</p>
      </InfoSection>

      <InfoSection id="tips" title="6. Voluntary tips">
        <p>
          The <PrefetchLink to="/support" className={external}>Support page</PrefetchLink> lets you send the developer a
          tip by UPI. Tips are voluntary personal gifts to the developer to help with hosting and development. They
          aren’t payment for music, content, a licence, an account or any service, they don’t unlock anything, and
          they’re non-refundable.
        </p>
      </InfoSection>

      <InfoSection id="warranty" title="7. No warranty, and limits on liability">
        <p>
          LOQmusic is provided free, <strong>“as is” and “as available”</strong>, without warranties of any kind. It
          may stop working, play the wrong thing, lose your locally saved library, or be unavailable at any time.
        </p>
        <p>
          To the fullest extent the law allows, the developer isn’t liable for any loss or damage arising from using,
          or being unable to use, LOQmusic or the third-party content and services it connects to. You use it at your
          own risk.
        </p>
      </InfoSection>

      <InfoSection id="changes" title="8. Changes and contact">
        <p>
          These terms may be updated from time to time; the date at the top shows the latest version. Continuing to use
          LOQmusic after a change means you accept it. Questions? Reach the developer on{' '}
          <a href={developer.linkedin} target="_blank" rel="noopener noreferrer" className={external}>LinkedIn</a> or{' '}
          <a href={developer.instagram} target="_blank" rel="noopener noreferrer" className={external}>Instagram</a>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
