'use server';

import { fetchYouTubeChannelInfoFlow } from '../../ai/flows/youtube-channel-info-flow';
import type { YouTubeChannelInfoInput, YouTubeChannelInfo } from '../../ai/flows/youtube-channel-info-flow';

export async function fetchYouTubeChannelInfo(input: YouTubeChannelInfoInput): Promise<YouTubeChannelInfo> {
  try {
    return await fetchYouTubeChannelInfoFlow(input);
  } catch (error: any) {
    console.error("fetchYouTubeChannelInfo failed:", error);
    throw new Error(error.message || "Failed to fetch YouTube channel details. Please verify the URL.");
  }
}
