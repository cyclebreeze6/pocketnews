'use server';
/**
 * @fileOverview Flow to automatically sync breaking news from configured channels.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';

const AutoSyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos added as Breaking News."),
  syncedChannels: z.number().describe("The number of channels that were processed."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type AutoSyncResult = z.infer<typeof AutoSyncResultSchema>;

async function runAutoSync(): Promise<AutoSyncResult> {
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();
    
    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0, errors: ["No channels are configured for syncing."] };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    let totalNewVideos = 0;
    let successfulSyncs = 0;
    const errorMessages: string[] = [];

    // Filter for specific keywords in title for "Breaking News"
    const breakingNewsKeywords = ['breaking', 'live', 'developing story'];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            // Fetch more recent videos for breaking news check
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 15 });

            const newBreakingVideos = fetchedVideos
                .filter(video => 
                    !existingIdsSet.has(video.videoId) && 
                    breakingNewsKeywords.some(keyword => video.title.toLowerCase().includes(keyword))
                )
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: 'Breaking News', // Assign to Breaking News
                    views: Math.floor(Math.random() * 1000),
                    watchTime: Math.floor(Math.random() * 100),
                }));
            
            if (newBreakingVideos.length > 0) {
                await saveSyncedVideos(newBreakingVideos);
                totalNewVideos += newBreakingVideos.length;
            }
            successfulSyncs++;

        } catch (error: any) {
            console.error(`Failed to sync channel "${channel.name}" for breaking news:`, error.message);
            errorMessages.push(`Channel "${channel.name}": ${error.message}`);
        }
    }

    return {
      newVideosAdded: totalNewVideos,
      syncedChannels: successfulSyncs,
      errors: errorMessages.length > 0 ? errorMessages : undefined,
    };
}


export const runAutoSyncBreakingNewsFlow = ai.defineFlow(
  {
    name: 'autoSyncBreakingNewsFlow',
    outputSchema: AutoSyncResultSchema,
  },
  runAutoSync
);
