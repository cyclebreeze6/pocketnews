'use server';
/**
 * @fileOverview Flow to automatically sync breaking news from configured channels.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { sendNewVideoNotification } from './send-notification-flow';

const AutoSyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos added as Breaking News."),
  syncedChannels: z.number().describe("The number of channels that were processed."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type AutoSyncResult = z.infer<typeof AutoSyncResultSchema>;

const autoSyncBreakingNewsFlow = ai.defineFlow(
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
    let totalNewVideosAdded = 0;
    let syncedChannels = 0;
    const errors: string[] = [];

    for (const channel of channelsToSync) {
      if (!channel.youtubeChannelUrl) continue;

      try {
        const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 5 }); // Fetch only latest 5
        const newVideos = fetchedVideos.filter(video => !existingIdsSet.has(video.videoId));

        if (newVideos.length > 0) {
          // Find the most recent video that contains "breaking news" or similar keywords
          const breakingNewsVideo = newVideos.find(v => v.title.toLowerCase().includes('breaking news'));
          
          if (breakingNewsVideo) {
            const videoToSave = {
              youtubeVideoId: breakingNewsVideo.videoId,
              title: breakingNewsVideo.title,
              description: breakingNewsVideo.description,
              thumbnailUrl: breakingNewsVideo.thumbnailUrl,
              channelId: channel.id,
              contentCategory: 'Breaking News', // Assign to Breaking News category
              views: Math.floor(Math.random() * 100), // Placeholder
              watchTime: Math.floor(Math.random() * 100), // Placeholder
            };

            await saveSyncedVideos([videoToSave]);
            totalNewVideosAdded++;
          }
        }
        syncedChannels++;
      } catch (error: any) {
        console.error(`Failed to sync channel "${channel.name}":`, error);
        errors.push(`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`);
      }
    }
    
    return { newVideosAdded: totalNewVideosAdded, syncedChannels, errors };
  }
);

export async function runAutoSyncBreakingNewsFlow(): Promise<AutoSyncResult> {
  return autoSyncBreakingNewsFlow();
}
