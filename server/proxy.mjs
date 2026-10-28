/**
 * LOQmusic's proxy: what BitChord's browser extension did, done on the server.
 *
 * The page asks for `/px/<host>/<path>?<query>`; this fetches
 * `https://<host>/<path>?<query>` with the headers that host expects
 * (the same rules as web/extension/lib/rules.ts) and streams the answer back.
 * Because the page and the proxy share an origin, there's no CORS to fight and
 * no extension to install.
 *
 * Only the hosts below are served, so this is not an open proxy.
 */
import dns from 'node:dns';
import net from 'node:net';
import { Readable } from 'node:stream';

// Many home networks advertise IPv6 without routing it: try IPv4 first, and race
// the families rather than waiting out a dead connection (seen as 10 s stalls).
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(true);
net.setDefaultAutoSelectFamilyAttemptTimeout(250);

export const PROXY_PREFIX = '/px/';

/** Host suffixes the proxy will reach. */
const ALLOWED_SUFFIXES = [
  'youtube.com',
  'googlevideo.com',
  'ytimg.com',
  'googleusercontent.com',
  'apple.com',
  'mzstatic.com',
  'spotify.com',
  'spotifycdn.com',
  'scdn.co',
  'lrc.red',
  'binimum.org',
  'boidu.dev',
  'paxsenix.org',
  'prjktla.my.id',
  'atomix.one',
  'prjktla.workers.dev',
  'vercel.app',
  'lrclib.net',
  'kugou.com',
  'musixmatch.com',
  'genius.com',
  'better-lyrics.boidu.dev',
  'simpmusic.org',
  'translate.googleapis.com',
  'googleapis.com',
  'megalobiz.com',
];

const YOUTUBE = 'https://www.youtube.com';
const YOUTUBE_MUSIC = 'https://music.youtube.com';

/** Request headers never forwarded: the proxy decides identity and transport. */
const DROP_REQUEST = new Set([
  'host',
  'connection',
  'origin',
  'referer',
  'cookie',
  'accept-encoding',
  'content-length',
  'transfer-encoding',
  'x-origin',
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-dest',
  'sec-fetch-user',
  'sec-ch-ua',
  'sec-ch-ua-mobile',
  'sec-ch-ua-platform',
  'priority',
  'upgrade-insecure-requests',
]);

/** Response headers dropped: Node already decoded the body, and cookies stay upstream. */
const DROP_RESPONSE = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
  'alt-svc',
  'strict-transport-security',
  'content-security-policy',
  'cross-origin-resource-policy',
  'cross-origin-opener-policy',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
]);

function allowed(host) {
  return ALLOWED_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function impersonate(headers, origin) {
  headers.set('Origin', origin);
  headers.set('Referer', `${origin}/`);
}

/** The per-host rules (web/extension/lib/rules.ts and lyricsFetch.ts). */
function applyHostRules(url, headers) {
  const host = url.hostname;
  if (host === 'music.youtube.com') {
    impersonate(headers, YOUTUBE_MUSIC);
    headers.set('X-Origin', YOUTUBE_MUSIC);
  } else if (host === 'www.youtube.com' || host === 'youtube.com') {
    impersonate(headers, YOUTUBE);
    if (url.pathname.startsWith('/youtubei/')) headers.set('X-Origin', YOUTUBE);
  } else if (host === 's.youtube.com') {
    impersonate(headers, YOUTUBE_MUSIC);
  } else if (host.endsWith('googlevideo.com')) {
    // VISIONOS URLs are fetched with no Origin at all, as the Android app does.
    if (!/[?&]c=VISIONOS(&|$)/.test(url.search)) impersonate(headers, YOUTUBE);
  } else if (host === 'amp-api.music.apple.com') {
    impersonate(headers, 'https://music.apple.com');
  } else if (host.endsWith('musixmatch.com')) {
    headers.set('Cookie', 'mxm_bab=AB');
  } else if (host.endsWith('spotify.com')) {
    impersonate(headers, 'https://open.spotify.com');
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
    req.on('error', reject);
  });
}

/** One retry when the connection itself fails (a reset, a dropped route); HTTP errors pass through. */
async function fetchWithRetry(target, init) {
  try {
    return await fetch(target, init);
  } catch (error) {
    if (init.signal?.aborted) throw error;
    await new Promise((r) => setTimeout(r, 150));
    return fetch(target, init);
  }
}

/**
 * Serves one `/px/...` request. Returns false when the URL isn't the proxy's,
 * so the caller can hand it on.
 */
export async function handleProxy(req, res) {
  if (!req.url?.startsWith(PROXY_PREFIX)) return false;

  const rest = req.url.slice(PROXY_PREFIX.length);
  const slash = rest.indexOf('/');
  const host = decodeURIComponent(slash === -1 ? rest.split('?')[0] : rest.slice(0, slash));
  const pathAndQuery = slash === -1 ? `/${rest.includes('?') ? rest.slice(rest.indexOf('?')) : ''}` : rest.slice(slash);

  if (!host || !allowed(host)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end(`LOQmusic's proxy doesn't serve ${host || 'that host'}`);
    return true;
  }

  const target = new URL(`https://${host}${pathAndQuery}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || DROP_REQUEST.has(key) || key.startsWith('x-loq-')) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  applyHostRules(target, headers);

  const method = req.method ?? 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  let upstream;
  try {
    upstream = await fetchWithRetry(target, { method, headers, body, redirect: 'follow', signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) return true;
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Upstream request failed: ${error instanceof Error ? error.message : String(error)}`);
    return true;
  }

  const out = {};
  upstream.headers.forEach((value, key) => {
    if (!DROP_RESPONSE.has(key)) out[key] = value;
  });
  // The final URL after redirects, for callers that read it (YouTube.js does).
  out['x-loq-final-url'] = upstream.url;
  out['cache-control'] ??= 'no-store';
  res.writeHead(upstream.status, out);

  if (!upstream.body || method === 'HEAD') {
    res.end();
    return true;
  }
  Readable.fromWeb(upstream.body)
    .on('error', () => res.destroy())
    .pipe(res);
  return true;
}
