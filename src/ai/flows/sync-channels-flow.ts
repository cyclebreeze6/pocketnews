'use server';
/**
 * @fileOverview Flow to sync all YouTube channels and add new videos.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';

export const FetchResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos that were successfully added across all channels."),
  syncedChannels: z.number().describe("The number of channels that were successfully synced."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type FetchResult = z.infer<typeof FetchResultSchema>;

export const fetchNewYouTubeVideosFlow = ai.defineFlow(
  {
    name: 'fetchNewYouTubeVideosFlow',
    outputSchema: FetchResultSchema,
  },
  async (): Promise<FetchResult> => {
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();
    
    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0, errors: ["No channels are configured for syncing."] };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    let totalNewVideos = 0;
    let successfulSyncs = 0;
    const errorMessages: string[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 10 });

            const newVideosToSave = fetchedVideos
                .filter(video => !existingIdsSet.has(video.videoId))
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: 'News', // Default category for sync
                    views: Math.floor(Math.random() * 100),
                    watchTime: Math.floor(Math.random() * 100),
                }));
            
            if (newVideosToSave.length > 0) {
                await saveSyncedVideos(newVideosToSave);
                totalNewVideos += newVideosToSave.length;
            }
            successfulSyncs++;

        } catch (error: any) {
            console.error(`Failed to sync channel "${channel.name}":`, error.message);
            errorMessages.push(`Channel "${channel.name}": ${error.message}`);
        }
    }

    return {
      newVideosAdded: totalNewVideos,
      syncedChannels: successfulSyncs,
      errors: errorMessages.length > 0 ? errorMessages : undefined,
    };
  }
);
