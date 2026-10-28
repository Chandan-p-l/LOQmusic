import { useEffect } from 'react';
import { useLocation } from 'react-router';
import site from '@/site.json';

export interface PageMeta {
  title: string;
  description: string;
  /** schema.org data for this page (a MusicAlbum, a MusicGroup), alongside index.html's site-wide graph. */
  jsonLd?: Record<string, unknown>;
  /** Keep the page out of search results (the 404). */
  noindex?: boolean;
}

const routes: Record<string, PageMeta | undefined> = site.routes;
const fallback: PageMeta = { title: site.title, description: site.description };

/** The site's own address, as the server wrote it into the canonical link (SITE_URL, when that's set). */
const origin = (() => {
  try {
    return new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).origin;
  } catch {
    return location.origin;
  }
})();

/** What a page with data of its own (an album, an artist) has said about itself. */
let override: { path: string; meta: PageMeta } | null = null;

function setContent(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value);
}

function apply(pathname: string, meta: PageMeta) {
  document.title = meta.title;
  setContent('meta[name="description"]', meta.description);
  setContent('meta[property="og:title"]', meta.title);
  setContent('meta[property="og:description"]', meta.description);
  setContent('meta[name="twitter:title"]', meta.title);
  setContent('meta[name="twitter:description"]', meta.description);
  setContent('meta[property="og:url"]', origin + pathname);
  setContent('meta[name="robots"]', meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', origin + pathname);

  let ld = document.getElementById('page-ld');
  if (!meta.jsonLd) return ld?.remove();
  if (!ld) {
    ld = document.createElement('script');
    ld.id = 'page-ld';
    ld.setAttribute('type', 'application/ld+json');
    document.head.append(ld);
  }
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', url: origin + pathname, ...meta.jsonLd });
}

/**
 * Keeps the tab title, the description and the canonical address in step with
 * the route, as server/seo.mjs writes them into the first page load. A page
 * that called useRouteMeta for this route wins over site.json.
 */
export function usePageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    apply(pathname, override?.path === pathname ? override.meta : (routes[pathname] ?? fallback));
  }, [pathname]);
}

/** A page's own title, description and structured data, once its data has loaded. Nothing yet leaves the defaults. */
export function useRouteMeta(meta: PageMeta | null | undefined) {
  const { pathname } = useLocation();
  const key = meta && JSON.stringify(meta);
  useEffect(() => {
    if (!meta) return;
    override = { path: pathname, meta };
    apply(pathname, meta);
    return () => {
      if (override?.path === pathname) override = null;
    };
    // `key` stands for `meta`, which callers rebuild on every render.
  }, [pathname, key]);
}
