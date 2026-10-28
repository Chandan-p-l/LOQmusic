/**
 * LOQmusic on Vercel: the dynamic half of server/index.mjs, as one Function.
 * Vercel's CDN serves the built files in dist/; vercel.json rewrites everything
 * else here: the proxy at /px/, robots.txt, sitemap.xml and llms.txt, and every
 * app route, which gets index.html with that route's title and summary.
 *
 * Rewrites keep the original address in req.url, so the shared handlers work unchanged.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { handleProxy } from '../server/proxy.mjs';
import { handleSeo, renderIndex, siteOrigin } from '../server/seo.mjs';

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
