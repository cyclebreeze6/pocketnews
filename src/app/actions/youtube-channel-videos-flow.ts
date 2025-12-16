'use server';

import { fetchChannelVideosFlow } from '../../ai/flows/youtube-channel-videos-flow';
import type { YouTubeChannelVideosInput, YouTubeVideoList, YouTubeVideoDetails } from '../../ai/flows/youtube-channel-videos-flow';

export async function fetchChannelVideos(input: YouTubeChannelVideosInput): Promise<YouTubeVideoList> {
  return fetchChannelVideosFlow(input);
}

// Re-export types for client-side usage
export type { YouTubeVideoDetails };
