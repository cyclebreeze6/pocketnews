'use server';

import { fetchChannelVideos } from '../../ai/flows/youtube-channel-videos-flow';
import type { YouTubeVideoList } from '../../ai/flows/youtube-channel-videos-flow';

export async function fetchChannelVideosAction(input: { channelUrl: string, channelId?: string, maxResults?: number }): Promise<YouTubeVideoList> {
  return fetchChannelVideos(input);
}
