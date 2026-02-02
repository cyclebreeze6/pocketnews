'use server';

import type { Channel } from '../../lib/types';
import 'dotenv/config';

/**
 * This action is temporarily disabled to ensure server stability.
 * It will return empty data to prevent downstream errors.
 * @param channelId - Optional ID to fetch a single channel.
 */
export async function getChannelsForSync(channelId?: string): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  console.warn('[getChannelsForSync] Temporarily disabled due to server instability. Returning empty data.');
  return { channelsToSync: [], existingYoutubeIds: [] };
}
