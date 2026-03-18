'use server';

import { syncChannelsInRange, resetSyncCursor } from '../../ai/flows/sync-channels-flow';

/**
 * Server Action to trigger channel synchronization.
 * Supports range filtering to prevent timeouts.
 */
export async function syncYouTubeChannels(range?: { start: string, end: string }) {
  return syncChannelsInRange(range);
}

/**
 * Server Action to manually reset the sync cursor.
 */
export async function triggerSyncReset() {
    try {
        await resetSyncCursor();
        return { success: true };
    } catch (error: any) {
        console.error("Failed to reset sync cursor:", error);
        return { success: false, error: error.message };
    }
}
