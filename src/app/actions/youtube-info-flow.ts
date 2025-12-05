'use server';

import { fetchYouTubeVideoInfoFlow } from '../../ai/flows/youtube-info-flow';
import type { YouTubeVideoInfoInput, YouTubeVideoInfo } from '../../ai/flows/youtube-info-flow';

// This is the exported wrapper function that your client-side code will call.
export async function fetchYouTubeVideoInfo(input: YouTubeVideoInfoInput): Promise<YouTubeVideoInfo> {
  return fetchYouTubeVideoInfoFlow(input);
}

export type { YouTubeVideoInfoInput, YouTubeVideoInfo };
