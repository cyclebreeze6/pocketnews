'use server';

import { fetchYouTubeChannelInfoFlow } from '../../ai/flows/youtube-channel-info-flow';
import type { YouTubeChannelInfoInput, YouTubeChannelInfo } from '../../ai/flows/youtube-channel-info-flow';

export async function fetchYouTubeChannelInfo(input: YouTubeChannelInfoInput): Promise<YouTubeChannelInfo> {
  return fetchYouTubeChannelInfoFlow(input);
}
