'use server';

import { syncSingleYouTubeChannelFlow } from '../../ai/flows/sync-single-channel-flow';
import type { SyncResult } from '../../ai/flows/sync-channels-flow';

export async function syncSingleYouTubeChannel(channelId: string): Promise<SyncResult> {
  return syncSingleYouTubeChannelFlow({ channelId });
}
