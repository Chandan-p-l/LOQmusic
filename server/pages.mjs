/**
 * Each route's readable summary, written into index.html's `#root` by
 * server/seo.mjs for crawlers that don't run JavaScript (most AI crawlers).
 * React replaces it on load. The About, Support and Terms bodies follow
 * src/pages/AboutPage.tsx, SupportPage.tsx and TermsPage.tsx; keep them in step.
 */
import site from '../src/site.json' with { type: 'json' };

const { developer } = site;
const out = (href, text) => `<a href="${href}" rel="noopener">${text}</a>`;
const developerLinks = `${out(developer.github, 'GitHub')}, ${out(developer.linkedin, 'LinkedIn')} and ${out(developer.instagram, 'Instagram')}`;

const features = `
<h2>Features</h2>
<ul>
  <li><strong>Play anything:</strong> search any song, album, artist or playlist and play it straight away, with music videos too.</li>
  <li><strong>Synced lyrics:</strong> word-by-word lyrics from 12 providers, with a provider picker and translation.</li>
  <li><strong>AutoMix:</strong> beat-matched DJ transitions between songs, or a crossfade from 0 to 12 seconds.</li>
  <li><strong>Sound:</strong> a 10-band equalizer with 14 presets and a preamp, speed from 0.5x to 2x, and a sleep timer.</li>
  <li><strong>Radio:</strong> 16 genre and mood stations, plus a personal station built from the songs you like.</li>
  <li><strong>Listen Together:</strong> start a party, share the link, and everyone hears the same song at the same moment.</li>
  <li><strong>Your library:</strong> liked songs, playlists, saved albums, followed artists and history, with backup and restore.</li>
  <li><strong>Everywhere:</strong> layouts for phone, tablet and desktop, six colour themes and keyboard shortcuts.</li>
</ul>`;

const faq = `
<h2>Questions</h2>
<h3>Is LOQmusic free?</h3>
<p>Yes. LOQmusic is completely free, with no ads, no subscription and no sign-up. It runs in your web browser, so there's nothing to install.</p>
<h3>Do I need an account?</h3>
<p>No. LOQmusic only asks for a name to greet you by. Your liked songs, playlists and history are stored in your own browser, not on a server.</p>
<h3>Does LOQmusic work on phones?</h3>
<p>Yes. LOQmusic has layouts for phones, tablets and desktops, and works in any modern browser on Android, iOS, Windows, macOS and Linux.</p>
<h3>Can I listen to music with friends?</h3>
<p>Yes. Listen Together lets you start a party and share a link, so everyone hears the same song at the same moment.</p>
<h3>Who made LOQmusic?</h3>
<p>LOQmusic is a non-commercial portfolio project by developer ${developer.name}. It hosts no music and isn't affiliated with YouTube, Google or any record label.</p>`;

const cta = `<p><a href="/home">Open LOQmusic and start listening</a>, free, with no sign-up.</p>`;

export const PAGES = {
  '/discover': `
<h1>Discover music by mood and genre</h1>
<p>Find something new to play on LOQmusic: browse moods such as chill, focus, workout and party, or genres such as pop, hip-hop and rock, and explore the playlists inside each. Every playlist plays free, with no sign-up and no ads.</p>
${cta}${features}`,

  '/new': `
<h1>New music releases</h1>
<p>The latest albums, singles and music videos, updated every day. Play any new release free on LOQmusic, with synced lyrics and no ads.</p>
${cta}${features}`,

  '/radio': `
<h1>Free online radio stations</h1>
<p>LOQmusic has 16 free genre and mood radio stations, plus a personal station built from the songs you like. Every station is never-ending, with AutoMix transitions between songs and no ads.</p>
<p>Stations: Chill Lo-fi, Bollywood Hits, Pop Now, Hip-Hop Heat, Indie Vibes, Workout, Romantic, Punjabi, EDM &amp; Dance, Rock Classics, Jazz Lounge, Focus, K-Pop, Sleep, Retro 90s and Devotional.</p>
${cta}${features}`,

  '/browse-all': `
<h1>Browse music</h1>
<p>Browse genres, moods, charts and new releases, then play any of them free on LOQmusic. No sign-up, no ads, nothing to install.</p>
${cta}${features}`,

  '/search': `
<h1>Search songs, artists and albums</h1>
<p>Search any song, artist, album, playlist or music video and play it free on LOQmusic, with word-synced lyrics, an equalizer and AutoMix. No sign-up, no ads.</p>
${cta}${features}`,

  '/together': `
<h1>Listen Together: share music in sync with friends</h1>
<p>Start a Listen Together party on LOQmusic, share the invite link, and everyone hears the same song at the same moment, wherever they are. The queue, play, pause and skips stay in sync for everyone. It's free and needs no account; you join under the name you gave LOQmusic.</p>
${cta}${features}`,

  '/about': `
<h1>About LOQmusic</h1>
<p>LOQmusic is a free music streaming web app. Search and play any song in your browser, with synced lyrics, AutoMix DJ transitions, an equalizer and Listen Together. No sign-up, no ads, nothing to install.</p>
${cta}${features}
<h2>A portfolio project</h2>
<p>LOQmusic was designed and built by <strong>${developer.name}</strong> as a personal portfolio project: a showcase of front-end engineering, audio processing and interface design. It's non-commercial. It doesn't sell anything, show ads, collect personal data or charge for features. Its playback engine comes from the open-source ${out('https://github.com/kushagrasinghx/BitChord', 'BitChord')} project (GPL-3.0).</p>
<p>LOQmusic doesn't host, upload or store any music. It's a player for music that YouTube Music already makes publicly available, and it isn't affiliated with, endorsed by or sponsored by YouTube, Google, Apple, Spotify, Musixmatch or any record label. Read the full <a href="/terms">terms and disclaimer</a>.</p>
${faq}
<h2>The developer</h2>
<p>${developer.name} is on ${developerLinks}. If LOQmusic has earned a place in your day, you can <a href="/support">support the developer</a>.</p>`,

  '/support': `
<h1>Support LOQmusic</h1>
<p>LOQmusic is free, with no ads and no subscription, and it always will be. It's built and kept running by one developer, ${developer.name}. If it's become part of your day, you can help keep it going.</p>
<h2>Support the developer</h2>
<p><img src="/support-qr.png" width="220" height="220" alt="UPI QR code to send a voluntary tip to ${developer.name}, the developer of LOQmusic" style="background:#fff;padding:12px;border-radius:18px" /></p>
<p>Scan the code with Google Pay, PhonePe, Paytm, BHIM or any other UPI app, or pay the UPI ID <strong>${developer.upi}</strong>, and send whatever amount feels right. Every tip goes straight to the developer and pays for the server, the domain and the hours spent on new features and fixes.</p>
<p><strong>It's completely optional.</strong> A tip is a voluntary gift to the developer. It doesn't buy music, an account, a subscription or any extra features; everyone gets the same LOQmusic. Tips can't be refunded.</p>
<h2>Meet the developer</h2>
<p>${developer.name} built LOQmusic as a portfolio project. Follow along or say hello on ${developerLinks}.</p>
<h2>Help</h2>
<h3>A song won't play</h3>
<p>Skip to the next song and come back, or reload the page. Some songs are blocked in some countries or by their owners, and LOQmusic can't play those.</p>
<h3>Lyrics are missing or out of time</h3>
<p>Open the lyrics panel and pick a different provider. LOQmusic asks 12 lyric sources and not every song is on every one.</p>
<h3>My playlists and likes disappeared</h3>
<p>Your library lives in this browser only. Clearing site data, using a private window or switching browsers starts afresh. Use Settings to back up your library to a file and restore it anywhere.</p>
<h3>Something else is broken, or you have an idea</h3>
<p>Message the developer on LinkedIn or Instagram, or open an issue on GitHub.</p>`,

  '/terms': `
<h1>Terms, privacy and disclaimer</h1>
<p>The short version: LOQmusic is a free, non-commercial portfolio project. It hosts no music, keeps your library in your own browser, and comes with no guarantees.</p>
<h2>1. A portfolio project</h2>
<p>LOQmusic is a personal portfolio and educational project made by ${developer.name} to demonstrate web development, audio and interface design skills. It isn't a company, a business or a commercial service. It doesn't sell anything, show ads, offer subscriptions or charge for features.</p>
<h2>2. No music is hosted here</h2>
<p>LOQmusic doesn't host, upload, store, sell or distribute any music, videos, lyrics or artwork. Everything you play is fetched at the moment you ask for it from third-party services where it's already publicly available, chiefly YouTube Music, and lyric providers. <strong>LOQmusic isn't affiliated with, endorsed by, sponsored by or connected to YouTube, Google, Apple, Spotify, Musixmatch, Discord, or any artist, record label or rights holder.</strong></p>
<h2>3. Copyright and takedown requests</h2>
<p>All songs, recordings, lyrics, artwork, artist names and trademarks belong to their respective owners. Rights holders can contact the developer through ${developerLinks} to have content removed or blocked.</p>
<h2>4. Using LOQmusic</h2>
<p>Use it for personal, non-commercial listening only. Don't download, copy, record or redistribute anyone's content, and don't attack or overload the site.</p>
<h2>5. Privacy</h2>
<p>LOQmusic has no accounts and doesn't collect personal data. Your name, likes, playlists, history and settings are saved in your own browser and never sent to the developer. There are no ads, no analytics trackers and no tracking cookies.</p>
<h2>6. Voluntary tips</h2>
<p>Tips sent through the <a href="/support">Support page</a> are voluntary personal gifts to the developer. They aren't payment for music, content, a licence, an account or any service, and they're non-refundable.</p>
<h2>7. No warranty</h2>
<p>LOQmusic is provided free, "as is" and "as available", without warranties of any kind. To the fullest extent the law allows, the developer isn't liable for any loss or damage arising from using it.</p>`,
};
