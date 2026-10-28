import type { Bridge } from '@/shared/bridge';
import { localBridge } from '@/net/localBridge';

/** LOQmusic's bridge is always there: it is the page's own proxy (net/localBridge.ts). */
export function getBridge(): Bridge | null {
  return localBridge;
}
