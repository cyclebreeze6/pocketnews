'use server';

import { searchYouTubeVideosFlow } from '../../ai/flows/youtube-search-flow';
import type { YouTubeSearchInput, YouTubeVideoList } from '../../ai/flows/youtube-search-flow';

export async function searchYouTubeVideos(input: YouTubeSearchInput): Promise<YouTubeVideoList> {
  return searchYouTubeVideosFlow(input);
}

export type { YouTubeSearchInput, YouTubeVideoList, YouTubeVideoDetails } from '../../ai/flows/youtube-search-flow';
