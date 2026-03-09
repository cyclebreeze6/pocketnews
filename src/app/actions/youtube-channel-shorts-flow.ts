'use server';

import { fetchChannelShorts } from '../../ai/flows/youtube-channel-shorts-flow';
import type { YouTubeShortList } from '../../ai/flows/youtube-channel-shorts-flow';

/**
 * Server action wrapper for fetching channel shorts.
 */
export async function fetchChannelShortsAction(input: { channelUrl: string, maxResults?: number }): Promise<YouTubeShortList> {
  return fetchChannelShorts(input);
}
