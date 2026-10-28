import { ExternalLink } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6';
import { useLocation } from 'react-router';
import { PrefetchLink } from '@/components/PrefetchLink';
import site from '@/site.json';

/** The About, Support and Terms pages: a title, a lead and glass sections in one readable column. */
export function InfoPage({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  // /terms#privacy and the like: the page scrolls inside #scrollable-page, so the browser won't jump there itself.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);
  return (
    <article className="mx-auto max-w-[calc(760px+2*var(--body-gutter))] px-(--body-gutter) pt-8 pb-16">
      <h1 className="type-header-emphasized">{title}</h1>
      <p className="mt-3 max-w-[640px] type-[500_16px/25px] text-secondary">{lead}</p>
      {children}
      <InfoFooter />
    </article>
  );
}

export function InfoSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-6">
      <h2 className="mb-3 px-1 type-[800_13px/16px] tracking-[0.1em] text-tertiary uppercase">{title}</h2>
      <div className="glass rounded-[26px] p-6 type-[500_14px/22px] text-secondary max-sm:p-5 [&_h3]:mt-5 [&_h3]:mb-1 [&_h3]:type-[700_15px/20px] [&_h3]:text-primary [&_h3:first-child]:mt-0 [&_li+li]:mt-1.5 [&_p+p]:mt-3 [&_strong]:text-primary [&_ul]:list-disc [&_ul]:ps-5 [&_p+ul]:mt-3 [&_ul+p]:mt-3">
        {children}
      </div>
    </section>
  );
}

const DEVELOPER_LINKS = [
  { href: site.developer.github, label: 'GitHub', handle: 'Chandan-p-l', icon: FaGithub },
  { href: site.developer.linkedin, label: 'LinkedIn', handle: 'Chandan Pal', icon: FaLinkedin },
  { href: site.developer.instagram, label: 'Instagram', handle: '@chandan_pal101', icon: FaInstagram },
];

/** The developer's GitHub, LinkedIn and Instagram, as 3D buttons. */
export function DeveloperLinks() {
  return (
    <ul className="grid list-none! grid-cols-3 gap-3 ps-0! max-md:grid-cols-1">
      {DEVELOPER_LINKS.map(({ href, label, handle, icon: Icon }) => (
        <li key={label} className="mt-0!">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            className="btn-3d flex! h-auto w-full items-center justify-start gap-3 rounded-[18px] px-4 py-3 text-start"
          >
            <Icon size={22} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block type-[700_14px/18px] text-primary">{label}</span>
              <span className="block truncate type-[500_12px/16px] text-secondary">{handle}</span>
            </span>
            <ExternalLink size={14} className="text-tertiary" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

const link = 'text-key hover:underline';

/** The portfolio-project note and the links between the three pages. */
function InfoFooter() {
  return (
    <footer className="mt-10 border-t border-divider pt-6 type-[500_12px/18px] text-tertiary">
      <nav aria-label="About LOQmusic" className="mb-3 flex flex-wrap gap-x-4 gap-y-1 type-[600_13px/18px]">
        <PrefetchLink to="/about" className={link}>About</PrefetchLink>
        <PrefetchLink to="/support" className={link}>Support</PrefetchLink>
        <PrefetchLink to="/terms" className={link}>Terms, privacy &amp; disclaimer</PrefetchLink>
      </nav>
      <p>
        LOQmusic is a non-commercial portfolio project by {site.developer.name}. It hosts no music and isn’t affiliated
        with, endorsed by or sponsored by YouTube, Google, Apple, Spotify, Musixmatch, Discord or any record label. All
        songs, artwork, names and trademarks belong to their owners.
      </p>
    </footer>
  );
}
