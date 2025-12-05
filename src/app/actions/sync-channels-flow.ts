'use server';

import { syncYouTubeChannelsFlow } from '../../ai/flows/sync-channels-flow';
import type { SyncResult } from '../../ai/flows/sync-channels-flow';

export async function syncYouTubeChannels(): Promise<SyncResult> {
  return syncYouTubeChannelsFlow();
}

// Re-exporting the type for client-side usage if needed
export type { SyncResult };
