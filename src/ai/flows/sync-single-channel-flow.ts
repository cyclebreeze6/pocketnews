/**
 * @fileOverview Flow to sync a single YouTube channel using the YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideos } from './youtube-channel-videos-flow';
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
  async (channelId: string): Promise<SyncResult> => {
    try {
        const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ channelId });
        
        if (channelsToSync.length === 0) {
            return { newVideosAdded: 0, errors: ["Channel not found or not configured for syncing."] };
        }
        
        const channel = channelsToSync[0];
        if (!channel.youtubeChannelUrl) {
            return { newVideosAdded: 0, errors: ["Channel does not have a YouTube URL."] };
        }

        const existingIdsSet = new Set(existingYoutubeIds);
        
        // Using optimized API fetcher
        const fetchedVideos = await fetchChannelVideos({ 
            channelUrl: channel.youtubeChannelUrl, 
            channelId: channel.youtubeChannelId,
            maxResults: 10 
        });
        
        const newVideosToSave = fetchedVideos
            .filter(video => !existingIdsSet.has(video.videoId))
            .map(video => ({
                youtubeVideoId: video.videoId,
                title: video.title,
                description: video.description,
                thumbnailUrl: video.thumbnailUrl,
                channelId: channel.id,
                contentCategory: 'Breaking News',
                views: Math.floor(Math.random() * 100),
                watchTime: Math.floor(Math.random() * 100),
                regions: channel.region || ['Global'],
            }));

        if (newVideosToSave.length > 0) {
            await saveSyncedVideos(newVideosToSave);
        }

        return { newVideosAdded: newVideosToSave.length };
    } catch (error: any) {
        console.error(`Failed to sync channel ${channelId}:`, error.message);
        return { newVideosAdded: 0, errors: [error.message] };
    }
  }
);
