'use server';

import { syncChannelsInRange } from '../../ai/flows/sync-channels-flow';

/**
 * Server Action to trigger channel synchronization.
 * Supports range filtering to prevent timeouts.
 */
export async function syncYouTubeChannels(range?: { start: string, end: string }) {
  return syncChannelsInRange(range);
}
