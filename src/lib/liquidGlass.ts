/**
 * Liquid glass, as iOS draws it: through the middle the pane is nearly clear,
 * and toward its rim what's behind it bends and magnifies, with a faint
 * rainbow where red, green and blue refract by different amounts.
 *
 * That's an SVG filter used as a `backdrop-filter`: a blur, then a
 * displacement map that is neutral in the middle and pushes inward along the
 * edges, applied three times at slightly different strengths, one per
 * colour channel. Only Chromium runs SVG filters as backdrop filters, so
 * elsewhere the panes keep their plain frosted CSS glass (global.css).
 *
 * A displacement map has to match its element's size exactly, so each
 * `.glass` / `.glass-thick` element gets a filter for its own size, made on
 * demand, shared by elements of the same size, and dropped once unused.
 * Only panes that float (outside the scrolling page) get it.
 */

const NS = 'http://www.w3.org/2000/svg';

interface Kind {
  blur: number;
  /** Displacement strength in px for the red channel; green and blue a little less. */
  scale: number;
  saturate: number;
}

const KINDS: Record<'glass' | 'glass-thick', Kind> = {
  glass: { blur: 3, scale: 38, saturate: 1.6 },
  'glass-thick': { blur: 9, scale: 34, saturate: 1.7 },
};

/** Whether this browser runs SVG backdrop filters (Chromium-based). */
export function supportsLiquidGlass(): boolean {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  if (brands) return brands.some((b) => /Chromium|Google Chrome|Microsoft Edge|Opera|Brave/.test(b.brand));
  return /Chrome\//.test(navigator.userAgent) && !/Edg\/|OPR\//.test(navigator.userAgent) ? true : false;
}

const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/**
 * The map for a w×h pane: red carries x, green carries y, 128 is "stay put".
 * Over the rim band (up to 40px, eased) the value rises to push the sample
 * inward, which reads as the edge lensing what's behind it.
 */
function mapFor(w: number, h: number): string {
  const stops = (size: number, channel: (v: number) => string) => {
    const band = Math.min(40, size * 0.3) / size;
    const out: string[] = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      out.push(`<stop offset='${(t * band).toFixed(4)}' stop-color='${channel(128 + 127 * Math.pow(1 - t, 2.4))}'/>`);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      out.push(`<stop offset='${(1 - t * band).toFixed(4)}' stop-color='${channel(128 - 128 * Math.pow(1 - t, 2.4))}'/>`);
    }
    return out.join('');
  };
  const svg =
    `<svg xmlns='${NS}' width='${w}' height='${h}'><defs>` +
    `<linearGradient id='x' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='${w}' y2='0'>${stops(w, (v) => `#${hex(v)}0000`)}</linearGradient>` +
    `<linearGradient id='y' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='0' y2='${h}'>${stops(h, (v) => `#00${hex(v)}00`)}</linearGradient>` +
    `</defs><rect width='${w}' height='${h}' fill='url(#x)'/><rect width='${w}' height='${h}' fill='url(#y)' style='mix-blend-mode:screen'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

let defs: SVGDefsElement | null = null;
const filters = new Map<string, { el: SVGFilterElement; users: number }>();
const assigned = new WeakMap<Element, string>();

function host(): SVGDefsElement {
  if (defs) return defs;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}

function node<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function buildFilter(id: string, w: number, h: number, kind: Kind): SVGFilterElement {
  const f = node('filter', { id, x: 0, y: 0, width: w, height: h, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
  f.append(
    node('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: kind.blur, result: 'blur' }),
    node('feImage', { href: mapFor(w, h), x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'map' }),
  );
  const channels: [string, number, string][] = [
    ['r', 1, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
    ['g', 0.92, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
    ['b', 0.84, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'],
  ];
  for (const [name, k, matrix] of channels) {
    f.append(
      node('feDisplacementMap', { in: 'blur', in2: 'map', scale: kind.scale * k, xChannelSelector: 'R', yChannelSelector: 'G', result: `d${name}` }),
      node('feColorMatrix', { in: `d${name}`, type: 'matrix', values: matrix, result: name }),
    );
  }
  f.append(
    node('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' }),
    node('feBlend', { in: 'rg', in2: 'b', mode: 'screen', result: 'rgb' }),
    node('feColorMatrix', { in: 'rgb', type: 'saturate', values: kind.saturate }),
  );
  return f;
}

function release(el: Element) {
  const id = assigned.get(el);
  if (!id) return;
  assigned.delete(el);
  const entry = filters.get(id);
  if (entry && --entry.users <= 0) {
    entry.el.remove();
    filters.delete(id);
  }
}

function apply(el: HTMLElement) {
  const kindName = el.classList.contains('glass-thick') ? 'glass-thick' : 'glass';
  const w = Math.round(el.offsetWidth);
  const h = Math.round(el.offsetHeight);
  if (w < 24 || h < 24) return release(el);
  const id = `lg-${kindName}-${w}x${h}`;
  if (assigned.get(el) === id) return;
  release(el);
  let entry = filters.get(id);
  if (!entry) {
    entry = { el: buildFilter(id, w, h, KINDS[kindName]), users: 0 };
    host().appendChild(entry.el);
    filters.set(id, entry);
  }
  entry.users++;
  assigned.set(el, id);
  el.style.setProperty('backdrop-filter', `url(#${id})`);
  el.style.setProperty('-webkit-backdrop-filter', `url(#${id})`);
}

function clear(el: HTMLElement) {
  release(el);
  el.style.removeProperty('backdrop-filter');
  el.style.removeProperty('-webkit-backdrop-filter');
}

/** Watches the page for glass panes and gives each its liquid filter; returns the stop. */
export function startLiquidGlass(): () => void {
  if (!supportsLiquidGlass()) return () => {};
  document.documentElement.dataset.liquid = '';
  const tracked = new Set<HTMLElement>();
  const resize = new ResizeObserver((entries) => {
    for (const e of entries) apply(e.target as HTMLElement);
  });
  const track = (el: HTMLElement) => {
    // Panes that scroll with the page would re-run the filter on every scroll
    // frame; they keep the GPU-drawn frosted glass. Floating panes refract.
    // Panes over moving light (neon mode) opt out with data-flat-glass for the same reason.
    if (tracked.has(el) || el.closest('#scrollable-page') || el.hasAttribute('data-flat-glass')) return;
    tracked.add(el);
    resize.observe(el);
    apply(el);
  };
  const scan = (root: ParentNode) => root.querySelectorAll<HTMLElement>('.glass, .glass-thick').forEach(track);
  scan(document);
  const mutations = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches('.glass, .glass-thick')) track(n);
        scan(n);
      });
    }
    // Panes that left the page give their filters back.
    for (const el of tracked) {
      if (!el.isConnected) {
        tracked.delete(el);
        resize.unobserve(el);
        clear(el);
      }
    }
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  return () => {
    mutations.disconnect();
    resize.disconnect();
    tracked.forEach(clear);
    delete document.documentElement.dataset.liquid;
  };
}
