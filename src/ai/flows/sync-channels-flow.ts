'use server';
/**
 * @fileOverview A flow for syncing new videos from multiple YouTube channels.
 *
 * - syncYouTubeChannelsFlow - The main function to trigger the sync process.
 * - SyncResult - The output type detailing how many videos were synced.
 */

import { ai } from '../genkit';
import { z } from 'zod';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';

export const SyncResultSchema = z.object({
  syncedChannels: z.number().describe('The number of channels that were checked for new content.'),
  newVideosAdded: z.number().describe('The total number of new videos added across all channels.'),
  errors: z.array(z.string()).describe('A list of errors encountered during the sync process.'),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

export const syncYouTubeChannelsFlow = ai.defineFlow(
  {
    name: 'syncYouTubeChannelsFlow',
    outputSchema: SyncResultSchema,
  },
  async () => {
    let syncedChannels = 0;
    let newVideosAdded = 0;
    const errors: string[] = [];

    // 1. Get channels and existing videos using a server action
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();

    if (channelsToSync.length === 0) {
      return { syncedChannels: 0, newVideosAdded: 0, errors: ["No channels are configured for syncing. Please add a YouTube Channel URL to one or more channels."] };
    }
    
    const existingIdsSet = new Set(existingYoutubeIds);

    // 2. Loop through each channel and sync videos
    for (const channel of channelsToSync) {
      if (!channel.youtubeChannelUrl) continue;

      try {
        // 2a. Fetch latest videos from the YouTube channel
        const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });
        syncedChannels++;

        // 2b. Filter out videos that already exist in our database
        const newVideosToSave = fetchedVideos.filter(video => !existingIdsSet.has(video.videoId));

        if (newVideosToSave.length === 0) continue;

        // 2c. Prepare video data for saving
        const videosData = newVideosToSave.map(videoData => ({
          youtubeVideoId: videoData.videoId,
          title: videoData.title,
          description: videoData.description,
          thumbnailUrl: videoData.thumbnailUrl,
          channelId: channel.id,
          contentCategory: 'Uncategorized',
          views: Math.floor(Math.random() * 100),
          watchTime: Math.floor(Math.random() * 100),
        }));

        // 2d. Use a server action to save the new videos in a batch
        await saveSyncedVideos(videosData);
        newVideosAdded += videosData.length;

        // Add newly saved video IDs to our set to prevent re-adding in this same run
        newVideosToSave.forEach(video => existingIdsSet.add(video.videoId));

      } catch (error: any) {
        console.error(`Failed to sync channel "${channel.name}":`, error);
        errors.push(`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`);
      }
    }

    return { syncedChannels, newVideosAdded, errors };
  }
);
