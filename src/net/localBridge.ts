import {
  BRIDGE_PROTOCOL,
  BridgeCallError,
  type Bridge,
  type DetectedExtension,
  type HttpRequest,
  type HttpResponse,
  type ParamsOf,
  type ResultOf,
  type BridgeMethod,
} from '@/shared/bridge';

/**
 * The bridge BitChord's pages talk to, answered in the page itself: every
 * call that was an HTTP exchange through the extension is a fetch through
 * LOQmusic's proxy instead (net/proxy.ts). Nothing here signs in: LOQmusic
 * has no accounts, so the sign-in methods report "not available".
 */

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function exchange(request: HttpRequest, signal?: AbortSignal): Promise<HttpResponse> {
  const body =
    request.body === undefined
      ? undefined
      : request.bodyEncoding === 'base64'
        ? Uint8Array.from(atob(request.body), (c) => c.charCodeAt(0))
        : request.body;
  let response: Response;
  try {
    response = await fetch(request.url, {
      method: request.method ?? 'GET',
      headers: request.headers ?? {},
      body: body as BodyInit | undefined,
      ...(signal && { signal }),
    });
  } catch (error) {
    throw new BridgeCallError('network', String(error));
  }
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => (headers[key] = value));
  const type = response.headers.get('content-type') ?? '';
  const textual = /json|text|javascript|xml|html/.test(type) || !type;
  return {
    status: response.status,
    headers,
    url: response.url,
    bodyEncoding: textual ? 'text' : 'base64',
    body: textual ? await response.text() : toBase64(new Uint8Array(await response.arrayBuffer())),
  };
}

const signedOut = { browserSignedIn: false, connected: false, signedIn: false, accounts: [], active: null, problem: null };

async function answer<M extends BridgeMethod>(method: M, params: ParamsOf<M>, signal?: AbortSignal): Promise<ResultOf<M>> {
  const p = params as Record<string, unknown>;
  switch (method) {
    case 'ping':
      return {
        version: '1.0.0',
        protocol: BRIDGE_PROTOCOL,
        browser: 'chromium',
        capabilities: ['yt', 'lyrics', 'addon'],
      } as ResultOf<M>;
    case 'yt.fetch':
      if (p.auth) throw new BridgeCallError('unauthenticated', 'LOQmusic has no sign-in.');
      return (await exchange(params as HttpRequest, signal)) as ResultOf<M>;
    case 'lyrics.fetch':
    case 'addon.fetch':
      return (await exchange(params as HttpRequest, signal)) as ResultOf<M>;
    case 'lyrics.permissions':
      // The proxy reaches every lyric host; there is nothing to grant.
      return { granted: (p.origins as string[]) ?? [] } as ResultOf<M>;
    case 'lyrics.requestPermissions':
      return {} as ResultOf<M>;
    case 'yt.authState':
    case 'yt.setConnected':
    case 'yt.selectChannel':
      return signedOut as ResultOf<M>;
    default:
      throw new BridgeCallError('unsupported', `${method} needs an account, and LOQmusic has none.`);
  }
}

export const localBridge: Bridge = {
  transport: 'external',
  call(method, params, options) {
    return answer(method, params, options?.signal);
  },
  subscribe() {
    return () => {};
  },
};

export const localExtension: DetectedExtension = {
  bridge: localBridge,
  info: { version: '1.0.0', protocol: BRIDGE_PROTOCOL, browser: 'chromium', capabilities: ['yt', 'lyrics', 'addon'] },
};
