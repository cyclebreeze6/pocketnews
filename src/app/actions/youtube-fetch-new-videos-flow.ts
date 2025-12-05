'use server';

import { fetchNewYouTubeVideosFlow } from '../../ai/flows/sync-channels-flow';
import type { FetchResult, FetchedVideo } from '../../ai/flows/sync-channels-flow';

export async function fetchNewYouTubeVideos(): Promise<FetchResult> {
  return fetchNewYouTubeVideosFlow();
}

export type { FetchResult, FetchedVideo };
