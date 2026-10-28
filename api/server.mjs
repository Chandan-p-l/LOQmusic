/**
 * LOQmusic on Vercel: the dynamic half of server/index.mjs, as one Function.
 * Vercel's CDN serves the built files in dist/; vercel.json rewrites everything
 * else here: the proxy at /px/, robots.txt, sitemap.xml and llms.txt, and every
 * app route, which gets index.html with that route's title and summary.
 *
 * Rewrites keep the original address in req.url, so the shared handlers work unchanged.
 *
 * YouTube answers requests from cloud IPs (Vercel's included) with "Sign in to
 * confirm you're not a bot", so songs won't play when this Function fetches them
 * itself. Set PROXY_ORIGIN to a LOQmusic server on another network (`npm start`
 * behind a Cloudflare Tunnel, say: https://px.example.com) and /px/ is passed
 * through to it, so YouTube sees that server's address instead.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { handleProxy } from '../server/proxy.mjs';
import { handleSeo, renderIndex, siteOrigin } from '../server/seo.mjs';

const PROXY_ORIGIN = process.env.PROXY_ORIGIN?.replace(/\/+$/, '');

/** Headers that belong to this hop, not the next one. */
const HOP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'content-encoding', 'keep-alive']);

/** /px/ handed on to PROXY_ORIGIN as it came, and its answer streamed back. */
async function forwardProxy(req, res) {
  const method = req.method ?? 'GET';
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined && !HOP.has(key) && !key.startsWith('x-vercel-') && !key.startsWith('x-forwarded-')) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  const body = method === 'GET' || method === 'HEAD' ? undefined : Readable.toWeb(req);
  const controller = new AbortController();
  res.on('close', () => controller.abort());
  const upstream = await fetch(PROXY_ORIGIN + req.url, { method, headers, body, duplex: 'half', redirect: 'manual', signal: controller.signal });
  const out = {};
  upstream.headers.forEach((value, key) => {
    if (!HOP.has(key)) out[key] = value;
  });
  res.writeHead(upstream.status, out);
  if (!upstream.body || method === 'HEAD') return void res.end();
  Readable.fromWeb(upstream.body)
    .on('error', () => res.destroy())
    .pipe(res);
}

/** The built page, bundled with the Function through vercel.json's includeFiles. */
let shell;
async function indexHtml() {
  shell ??= await readFile(new URL('../dist/index.html', import.meta.url), 'utf8').catch(() =>
    readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8'),
  );
  return shell;
}

export default async function handler(req, res) {
  try {
    if (PROXY_ORIGIN && req.url?.startsWith('/px/')) return await forwardProxy(req, res);
    if (await handleProxy(req, res)) return;
    if (await handleSeo(req, res)) return;
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const html = renderIndex(await indexHtml(), path, siteOrigin(req));
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      // The page names its hashed assets, so the CDN may hold it only briefly.
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    });
    res.end(html);
  } catch (error) {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(error));
  }
}
