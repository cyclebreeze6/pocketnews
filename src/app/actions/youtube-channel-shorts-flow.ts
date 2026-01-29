'use server';

import { fetchChannelShortsFlow } from '../../ai/flows/youtube-channel-shorts-flow';
import type { YouTubeChannelShortsInput, YouTubeShortList } from '../../ai/flows/youtube-channel-shorts-flow';

export async function fetchChannelShorts(input: YouTubeChannelShortsInput): Promise<YouTubeShortList> {
  return fetchChannelShortsFlow(input);
}
