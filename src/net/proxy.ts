/**
 * Routes the page's requests to YouTube, googlevideo and the lyric hosts
 * through LOQmusic's own proxy (server/proxy.mjs), which adds the headers
 * those hosts expect. This is what BitChord's extension did; here nothing has
 * to be installed.
 *
 * Imported first in main.tsx, so every later `fetch` (YouTube.js, Shaka,
 * AutoMix, lyrics) goes through it.
 */

/** Must match ALLOWED_SUFFIXES in server/proxy.mjs. */
const PROXIED_SUFFIXES = [
  'youtube.com',
  'googlevideo.com',
  'apple.com',
  'spotify.com',
  'lrc.red',
  'binimum.org',
  'boidu.dev',
  'paxsenix.org',
  'prjktla.my.id',
  'atomix.one',
  'prjktla.workers.dev',
  'lyricsplus-seven.vercel.app',
  'lyrics-plus-backend.vercel.app',
  'lrclib.net',
  'kugou.com',
  'musixmatch.com',
  'genius.com',
  'simpmusic.org',
  'translate.googleapis.com',
  'megalobiz.com',
];

const PREFIX = '/px/';

export function isProxied(url: URL): boolean {
  if (url.protocol !== 'https:' || url.origin === location.origin) return false;
  const host = url.hostname;
  return PROXIED_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/** `https://host/path?q` → `/px/host/path?q`. */
export function proxyUrl(url: string | URL): string {
  const u = typeof url === 'string' ? new URL(url) : url;
  return `${PREFIX}${u.host}${u.pathname}${u.search}`;
}

/** The original URL back from a proxied response, so callers that read `response.url` see what they asked for. */
function withUrl(response: Response, original: string): Response {
  const finalUrl = response.headers.get('x-loq-final-url') ?? original;
  try {
    Object.defineProperty(response, 'url', { value: finalUrl });
  } catch {
    // Some engines freeze it; nothing reads it for anything critical.
  }
  return response;
}

const nativeFetch = globalThis.fetch.bind(globalThis);

async function loqFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const raw = input instanceof Request ? input.url : input.toString();
  let url: URL;
  try {
    url = new URL(raw, location.href);
  } catch {
    return nativeFetch(input, init);
  }
  if (!isProxied(url)) return nativeFetch(input, init);

  const target = proxyUrl(url);
  let response: Response;
  if (input instanceof Request) {
    const body = init?.body ?? (input.method === 'GET' || input.method === 'HEAD' ? undefined : await input.clone().arrayBuffer());
    response = await nativeFetch(target, {
      method: init?.method ?? input.method,
      headers: init?.headers ?? input.headers,
      body: body ?? null,
      signal: init?.signal ?? input.signal,
      credentials: 'same-origin',
    });
  } else {
    response = await nativeFetch(target, { ...init, credentials: 'same-origin', referrerPolicy: 'no-referrer' });
  }
  return withUrl(response, url.toString());
}

let installed = false;

export function installProxyFetch(): void {
  if (installed) return;
  installed = true;
  globalThis.fetch = loqFetch as typeof fetch;
}

installProxyFetch();
