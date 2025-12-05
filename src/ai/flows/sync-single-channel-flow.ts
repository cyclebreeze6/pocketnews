/**
 * @fileOverview Flow to sync a single YouTube channel.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';

export const SyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The number of new videos that were successfully added."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;


export const syncSingleYouTubeChannelFlow = ai.defineFlow(
  {
    name: 'syncSingleYouTubeChannelFlow',
    inputSchema: z.string(), // Channel ID
    outputSchema: SyncResultSchema,
  },
  async (channelId) => {
    
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync(channelId);

    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, errors: [`Channel with ID ${channelId} not found or has no YouTube URL.`] };
    }

    const channel = channelsToSync[0];
    const existingIdsSet = new Set(existingYoutubeIds);
    let newVideosAdded = 0;
    
    try {
      const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl! });
      
      const newVideos = fetchedVideos.filter(video => !existingIdsSet.has(video.videoId));

      if (newVideos.length > 0) {
        const videosToSave = newVideos.map(video => ({
          youtubeVideoId: video.videoId,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          channelId: channel.id,
          // Assign a default category; this can be changed later by a creator/admin
          contentCategory: 'News',
          views: Math.floor(Math.random() * 100), // Placeholder
          watchTime: Math.floor(Math.random() * 100), // Placeholder
        }));

        await saveSyncedVideos(videosToSave);
        newVideosAdded = videosToSave.length;
      }
      
      return { newVideosAdded, errors: [] };

    } catch (error: any) {
      console.error(`Failed to sync channel "${channel.name}":`, error);
      return { newVideosAdded: 0, errors: [`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`] };
    }
  }
);
