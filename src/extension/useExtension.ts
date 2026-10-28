import type { DetectedExtension } from '@/shared/bridge';
import { localExtension } from '@/net/localBridge';

export type ExtensionStatus =
  | { state: 'checking' }
  | { state: 'missing' }
  | { state: 'present'; extension: DetectedExtension };

export const extensionQueryKey = ['extension', 'detect'] as const;

/** LOQmusic needs no extension: its proxy answers everything the extension did. */
export function useExtension(): ExtensionStatus {
  return { state: 'present', extension: localExtension };
}
