/**
 * LOQmusic in production: serves the built site from dist/ and the proxy at /px/.
 *
 *   npm run build && npm start      (PORT defaults to 5180)
 */
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { handleProxy } from './proxy.mjs';
import { handleSeo, renderIndex, siteOrigin } from './seo.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.env.PORT) || 5180;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/** Text worth compressing; the models and images are already as small as they get. */
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.webmanifest']);
const gzipOk = (req, file) => COMPRESSIBLE.has(extname(file)) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');

async function serveStatic(req, res) {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(DIST, path));
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  let info = await stat(file).catch(() => null);
  // Client-side routes all render index.html.
  if (!info || info.isDirectory()) {
    file = join(DIST, 'index.html');
    info = await stat(file).catch(() => null);
  }
  if (!info) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Run `npm run build` first.');
    return;
  }
  const pageRequest = file === join(DIST, 'index.html');
  const immutable = file.includes(`${DIST}assets`);
  const gzip = gzipOk(req, file);
  const headers = {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    Vary: 'Accept-Encoding',
    ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
  };
  // Every route renders index.html, with that route's title, description and canonical address.
  if (pageRequest) {
    const html = renderIndex(await readFile(file, 'utf8'), path, siteOrigin(req));
    res.writeHead(200, headers);
    if (!gzip) return void res.end(html);
    const zip = createGzip();
    zip.pipe(res);
    zip.end(html);
    return;
  }
  res.writeHead(200, gzip ? headers : { ...headers, 'Content-Length': info.size });
  const stream = createReadStream(file);
  if (gzip) stream.pipe(createGzip()).pipe(res);
  else stream.pipe(res);
}

createServer((req, res) => {
  handleProxy(req, res)
    .then((handled) => handled || handleSeo(req, res))
    .then((handled) => handled || serveStatic(req, res))
    .catch((error) => {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String(error));
    });
}).listen(PORT, () => {
  console.log(`LOQmusic is playing on http://localhost:${PORT}`);
});
