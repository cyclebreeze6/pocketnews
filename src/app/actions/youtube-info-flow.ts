'use server';

import { fetchYouTubeVideoInfoFlow, type YouTubeVideoInfoInput, type YouTubeVideoInfo } from '../../ai/flows/youtube-info-flow';

// This is the exported wrapper function that your client-side code will call.
export async function fetchYouTubeVideoInfo(input: YouTubeVideoInfoInput): Promise<YouTubeVideoInfo> {
  return fetchYouTubeVideoInfoFlow(input);
}
