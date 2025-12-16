'use server';

import { fetchNewYouTubeVideosFlow } from '../../ai/flows/sync-channels-flow';
import type { FetchResult } from '../../ai/flows/sync-channels-flow';

export async function syncYouTubeChannels(): Promise<FetchResult> {
  return fetchNewYouTubeVideosFlow();
}
