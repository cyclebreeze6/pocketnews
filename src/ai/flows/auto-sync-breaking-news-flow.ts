'use server';
/**
 * @fileOverview Flow to automatically sync the single latest video from each channel and assign it to 'Breaking News'.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';

export const AutoSyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos added as Breaking News."),
  syncedChannels: z.number().describe("The number of channels that were processed."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type AutoSyncResult = z.infer<typeof AutoSyncResultSchema>;

export const autoSyncBreakingNewsFlow = ai.defineFlow(
  {
    name: 'autoSyncBreakingNewsFlow',
    outputSchema: AutoSyncResultSchema,
  },
  async () => {
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();
    
    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0, errors: ["No channels are configured for syncing."] };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    const errors: string[] = [];
    const allVideosToSave: any[] = [];

    for (const channel of channelsToSync) {
      if (!channel.youtubeChannelUrl) continue;

      try {
        const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });
        
        // Get the single latest video
        const latestVideo = fetchedVideos?.[0];

        if (latestVideo && !existingIdsSet.has(latestVideo.videoId)) {
           const videoToSave = {
            youtubeVideoId: latestVideo.videoId,
            title: latestVideo.title,
            description: latestVideo.description,
            thumbnailUrl: latestVideo.thumbnailUrl,
            channelId: channel.id,
            contentCategory: 'Breaking News', // Assign to Breaking News category
            views: Math.floor(Math.random() * 100), 
            watchTime: Math.floor(Math.random() * 100), 
          };
          allVideosToSave.push(videoToSave);
          // Add to existing IDs set to avoid duplicates within the same run if a video appears in multiple "channels" (unlikely but safe)
          existingIdsSet.add(videoToSave.youtubeVideoId);
        }
      } catch (error: any) {
        console.error(`Failed to sync latest video for channel "${channel.name}":`, error);
        errors.push(`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`);
      }
    }

    if (allVideosToSave.length > 0) {
        try {
            await saveSyncedVideos(allVideosToSave);
        } catch (saveError: any) {
            errors.push(`Failed to save videos to database: ${saveError.message}`);
        }
    }
    
    return { 
        newVideosAdded: allVideosToSave.length, 
        syncedChannels: channelsToSync.length, 
        errors 
    };
  }
);
