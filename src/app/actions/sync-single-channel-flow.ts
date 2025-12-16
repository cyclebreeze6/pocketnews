'use server';

import { syncSingleYouTubeChannelFlow, type SyncResult } from '../../ai/flows/sync-single-channel-flow';

export async function syncSingleYouTubeChannel(channelId: string): Promise<SyncResult> {
  return syncSingleYouTubeChannelFlow(channelId);
}
