# LOQmusic

A music website built on BitChord's engine: search and stream anything on YouTube Music, with
synced lyrics, AutoMix DJ transitions, a 10-band equalizer and Listen Together. It has a glass
and 3D-button interface.

There's **no login**. On the first visit LOQmusic asks for your name. Likes, playlists, saved
albums, followed artists and history are kept in your browser.

## Run it

Node 22 or newer.

```bash
cd LOQmusic
npm install
npm run dev          # http://localhost:5180
```

Production:

```bash
npm run build
npm start            # http://localhost:5180 (PORT to change it)
```

Set `SITE_URL` to the public address (`SITE_URL=https://your-domain.com npm start`, no trailing
slash) so canonical links, the sitemap and the share image point at the real domain. Without it
they use the request's host.

## Deploy on Vercel

`vercel.json` sends everything that isn't a built file to one Function, `api/server.mjs`,
which runs the same proxy and SEO handlers as `server/index.mjs`. Import the repo in Vercel
with the defaults, and set `SITE_URL` to the production address in the project's environment
variables.

**Songs won't play from Vercel alone.** YouTube answers requests from cloud IPs, Vercel's
included, with "Sign in to confirm you're not a bot". Pages, search and the home feed still load,
but the player gets no streams. Run `npm start` on a machine on another network (a home PC or a
small VPS) and set `PROXY_ORIGIN` in Vercel to its public address. The Function then passes
`/px/` through to it, so YouTube sees that machine instead. A free Cloudflare Tunnel gives a home
PC a public HTTPS address without opening ports:

```bash
npm run build && npm start                           # LOQmusic on http://localhost:5180
cloudflared tunnel --url http://localhost:5180       # prints https://<random>.trycloudflare.com
```

Set `PROXY_ORIGIN` to that address and redeploy. For an address that doesn't change, create a
named tunnel on your own domain.

## Search engines and AI assistants

- **`server/seo.mjs`** serves `/robots.txt`, `/sitemap.xml` and `/llms.txt`, and writes each
  route's title, description and canonical address into `index.html`. Titles and descriptions
  live in **`src/site.json`**, which `src/lib/pageMeta.ts` also uses to update them on navigation.
- **`index.html`** carries Open Graph and Twitter tags, JSON-LD (WebSite, WebApplication, the
  developer, FAQ) and a plain-HTML summary inside `#root` for crawlers that don't run JavaScript.
  React replaces it on load. Keep its FAQ in step with `src/pages/AboutPage.tsx`.
- `/about`, `/support` and `/terms` open without the name prompt, so crawlers can read them.

## How it works without the BitChord extension

BitChord's web player needs a browser extension to reach YouTube, googlevideo and the lyric
hosts. LOQmusic does that job on its own server instead:

- **`server/proxy.mjs`** answers `/px/<host>/<path>`. It fetches `https://<host>/<path>` with
  the headers the extension's rules used to add (YouTube's Origin, none on VISIONOS streams,
  Apple's Origin, Musixmatch's cookie) and streams the answer back. Only an allowlist of music
  and lyric hosts is served, so it isn't an open proxy.
- **`src/net/proxy.ts`** routes the page's `fetch` calls for those hosts to `/px/`. That covers
  YouTube.js, Shaka, AutoMix and the lyric providers.
- **`src/net/localBridge.ts`** answers the extension bridge's HTTP methods (`yt.fetch`,
  `lyrics.fetch`) with the same proxy, and reports that there's no sign-in.

The dev server (`vite.config.ts`) and `server/index.mjs` mount the same proxy.

Stream URLs are tied to the IP address that requested them. The proxy fetches the stream as
well as the player response, so the two always match, whether it runs locally or on a host.

## Features

| Area | What's there |
|---|---|
| Find music | Home feed, Trending hero, Global Top 50, Discover (moods and genres, Explore), New Releases, Browse, search with suggestions, album, artist and playlist pages |
| Playback | Gapless queue, Up Next with drag to reorder, shuffle, repeat, AutoPlay radio, crossfade (0–12 s), AutoMix beat-matched DJ blends, music videos, motion artwork |
| Sound | 10-band equalizer with 14 presets and a preamp, speed 0.5×–2×, sleep timer (minutes or end of track, with a fade-out), Stats for Nerds |
| Lyrics | Word-synced lyrics from 12 providers, with a provider picker and translation |
| Library (local) | Liked Songs, your own playlists (create, edit, add, remove, export), saved albums and playlists, followed artists, history, library backup and restore |
| Together | Listen Together parties under your LOQmusic name (needs a party server; see `.env.example`) |
| Radio | 16 genre and mood stations, plus a personal station seeded from your likes |
| Look | Six accent themes, artwork-tinted pages, spinning vinyl players, layouts for desktop, tablet and phone |
| Keys | Space, ←/→ seek, Ctrl+←/→ skip, ↑/↓ volume, M, S, R, L, Q, F, H, / |

## Layout

| Path | What |
|---|---|
| `src/shell/` | The app frame: `Sidebar`, `RightRail`, `PlayerDock`, `FullScreenPlayer`, `MobileNav`, `Onboarding`, `controls.tsx` |
| `src/pages/` | Pages |
| `src/components/loq/` | LOQmusic's own pieces: `Vinyl`, `ChartTable`, `PlaylistDialogs`, dialogs and toasts |
| `src/state/library.ts` | The local library and profile |
| `src/playback/audioFx.ts`, `loqRuntime.ts` | Equalizer, speed, sleep timer, history |
| `src/styles/` | Design tokens (`tokens.css`) and the `glass`, `btn-3d`, `btn-3d-key` and `vinyl` utilities (`global.css`) |
| Everything else in `src/` | BitChord's web engine, copied from `web/app` |

LOQmusic is a non-commercial portfolio project by [Chandan Pal](https://github.com/Chandan-p-l).
It hosts no music and is not affiliated with YouTube, Google or any record label. See `/terms`.
