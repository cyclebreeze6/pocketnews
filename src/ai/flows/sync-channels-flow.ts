'use server';
/**
 * @fileOverview Flow to sync all YouTube channels and add new videos.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow, YouTubeVideoDetailsSchema } from './youtube-channel-videos-flow';
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
  async () => {
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();
    
    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0, errors: ["No channels are configured for syncing."] };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    let totalNewVideosAdded = 0;
    let syncedChannels = 0;
    const errors: string[] = [];
    const allVideosToSave: any[] = [];

    for (const channel of channelsToSync) {
      if (!channel.youtubeChannelUrl) continue;

      try {
        const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });
        const newVideos = fetchedVideos.filter(video => !existingIdsSet.has(video.videoId));

        if (newVideos.length > 0) {
           const videosToSave = newVideos.map(video => ({
            youtubeVideoId: video.videoId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            channelId: channel.id,
            contentCategory: 'News', // Default category
            views: Math.floor(Math.random() * 100), 
            watchTime: Math.floor(Math.random() * 100), 
          }));
          allVideosToSave.push(...videosToSave);
        }
        syncedChannels++;
      } catch (error: any) {
        console.error(`Failed to sync channel "${channel.name}":`, error);
        errors.push(`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`);
      }
    }

    if (allVideosToSave.length > 0) {
        try {
            await saveSyncedVideos(allVideosToSave);
            totalNewVideosAdded = allVideosToSave.length;
        } catch (saveError: any) {
            errors.push(`Failed to save videos to database: ${saveError.message}`);
        }
    }
    
    return { newVideosAdded: totalNewVideosAdded, syncedChannels, errors };
  }
);
