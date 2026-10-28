import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
// @ts-expect-error plain ESM module shared with the production server
import { handleProxy } from './server/proxy.mjs';
// @ts-expect-error plain ESM module shared with the production server
import { handleSeo, renderIndex } from './server/seo.mjs';

/** Mounts LOQmusic's proxy (server/proxy.mjs) on the dev server, as server/index.mjs does in production. */
function loqProxy(): Plugin {
  return {
    name: 'loq-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleProxy(req, res)
          .then((handled: boolean) => handled || next())
          .catch(next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleProxy(req, res)
          .then((handled: boolean) => handled || next())
          .catch(next);
      });
    },
  };
}

/** robots.txt, sitemap.xml, llms.txt and per-route page titles on the dev server, as server/index.mjs serves them. */
function loqSeo(): Plugin {
  let origin = 'http://localhost:5180';
  return {
    name: 'loq-seo',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        origin = process.env.SITE_URL?.replace(/\/+$/, '') ?? `http://${req.headers.host ?? 'localhost:5180'}`;
        handleSeo(req, res)
          .then((handled: boolean) => handled || next())
          .catch(next);
      });
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // The built file keeps its placeholders; server/index.mjs fills them per request.
        if (!ctx.server) return html;
        return renderIndex(html, new URL(ctx.originalUrl ?? ctx.path, 'http://x').pathname, origin);
      },
    },
  };
}

export default defineConfig({
  plugins: [loqProxy(), loqSeo(), react(), tailwindcss()],
  define: {
    DEV_EXTENSION_ID: JSON.stringify(''),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // AutoMix's analysis worker: essentia.js's Emscripten glue breaks under dep pre-bundling.
  optimizeDeps: { exclude: ['essentia.js'] },
  worker: { format: 'es' },
  server: { port: 5180 },
  preview: { port: 5180 },
});
