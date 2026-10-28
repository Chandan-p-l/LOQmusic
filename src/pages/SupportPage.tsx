import { Copy, HeartHandshake, Smartphone } from 'lucide-react';
import { DeveloperLinks, InfoPage, InfoSection } from '@/components/loq/Info';
import { PrefetchLink } from '@/components/PrefetchLink';
import site from '@/site.json';
import { toast } from '@/state/toast';

/** The same payment the QR code carries, for phones, which can't scan their own screen. */
const UPI_LINK = `upi://pay?pa=${site.developer.upi}&pn=${encodeURIComponent(site.developer.name)}&tn=${encodeURIComponent('Supporting LOQmusic')}`;

export default function SupportPage() {
  return (
    <InfoPage
      title="Support LOQmusic"
      lead={
        <>
          LOQmusic is free, with no ads and no subscription, and it always will be. It’s built and kept running by one
          developer, {site.developer.name}. If it’s become part of your day, you can help keep it going.
        </>
      }
    >
      <InfoSection id="donate" title="Support the developer">
        <div className="flex items-center gap-8 max-md:flex-col max-md:items-stretch">
          <figure className="shrink-0 self-center">
            <div className="rounded-[22px] bg-white p-3 shadow-[0_10px_40px_rgba(var(--accent-2-rgb),.35)]">
              <img
                src="/support-qr.png"
                width={220}
                height={220}
                alt={`UPI QR code to send a voluntary tip to ${site.developer.name}, the developer of LOQmusic`}
                className="block size-[220px] [image-rendering:pixelated]"
              />
            </div>
            <figcaption className="mt-3 text-center type-[600_12px/16px] text-tertiary">Scan with any UPI app</figcaption>
          </figure>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2">
              <HeartHandshake size={18} className="text-key" aria-hidden="true" />
              Pay what you like, if you like
            </h3>
            <p>
              Scan the code with Google Pay, PhonePe, Paytm, BHIM or any other UPI app and send whatever amount feels
              right. Every tip goes straight to the developer and pays for the server, the domain and the hours spent
              on new features and fixes.
            </p>
            <p>
              <strong>It’s completely optional.</strong> A tip is a voluntary gift to the developer. It doesn’t buy
              music, an account, a subscription or any extra features; everyone gets the same LOQmusic. Tips can’t be
              refunded, so please only send what you’re comfortable giving.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={UPI_LINK} className="btn-3d-key flex! h-11 gap-2 rounded-full px-5 type-[700_14px/18px] md:hidden!">
                <Smartphone size={16} aria-hidden="true" />
                Pay with a UPI app
              </a>
              <button
                className="btn-3d flex! h-11 gap-2 rounded-full px-5 type-[700_14px/18px]"
                onClick={() =>
                  navigator.clipboard.writeText(site.developer.upi).then(
                    () => toast('UPI ID copied'),
                    () => toast(`UPI ID: ${site.developer.upi}`),
                  )
                }
              >
                <Copy size={16} aria-hidden="true" />
                Copy UPI ID <span className="type-[500_13px/18px] text-secondary">{site.developer.upi}</span>
              </button>
            </div>
            <p className="mt-4!">Can’t tip? Sharing LOQmusic with a friend or following the developer helps just as much.</p>
          </div>
        </div>
      </InfoSection>

      <InfoSection id="developer" title="Meet the developer">
        <p className="mb-4">
          Hi, I’m <strong>{site.developer.name}</strong>. I built LOQmusic as a portfolio project to show what a fast,
          good-looking music player can do in a browser. Follow along, see my other work, or say hello:
        </p>
        <DeveloperLinks />
      </InfoSection>

      <InfoSection id="help" title="Help">
        <h3>A song won’t play</h3>
        <p>
          Skip to the next song and come back, or reload the page. Some songs are blocked in some countries or by their
          owners, and LOQmusic can’t play those.
        </p>
        <h3>Lyrics are missing or out of time</h3>
        <p>
          Open the lyrics panel and pick a different provider. LOQmusic asks 12 lyric sources and not every song is on
          every one.
        </p>
        <h3>My playlists and likes disappeared</h3>
        <p>
          Your library lives in this browser only. Clearing site data, using a private window or switching browsers
          starts afresh. Use <PrefetchLink to="/settings" className="text-key hover:underline">Settings</PrefetchLink>{' '}
          to back up your library to a file and restore it anywhere.
        </p>
        <h3>Something else is broken, or you have an idea</h3>
        <p>
          Message the developer on LinkedIn or Instagram, or open an issue on GitHub. Bug reports with the song and
          browser you were using are the quickest to fix.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
