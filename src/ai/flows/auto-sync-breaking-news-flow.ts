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

// A list of major news outlets to be considered for "Breaking News"
const BREAKING_NEWS_CHANNEL_NAMES = [
  'cnn', 
  'aljazeera', // Note: 'Aljazeera' instead of 'Al Jazeera English' for broader matching
  'fox news', 
  'abc news', 
  'africa news', 
  'channels news', // Assuming this matches 'Channels Television'
  'channels television',
  'cbs news', 
  'sky news', 
  'reuters'
];

async function runAutoSync(): Promise<AutoSyncResult> {
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();
    
    // Filter the channels to only include the designated breaking news sources
    const breakingNewsChannels = channelsToSync.filter(c => 
      BREAKING_NEWS_CHANNEL_NAMES.includes(c.name.toLowerCase())
    );

    if (breakingNewsChannels.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0, errors: ["No breaking news channels are configured for syncing."] };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    let totalNewVideos = 0;
    let successfulSyncs = 0;
    const errorMessages: string[] = [];

    for (const channel of breakingNewsChannels) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            // Fetch more recent videos to ensure we catch breaking stories
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 15 });

            // All new videos from these channels are considered "Breaking News"
            const newBreakingVideos = fetchedVideos
                .filter(video => !existingIdsSet.has(video.videoId))
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: 'Breaking News', // Assign all to Breaking News category
                    views: Math.floor(Math.random() * 1000), // Placeholder views
                    watchTime: Math.floor(Math.random() * 100), // Placeholder watch time
                }));
            
            if (newBreakingVideos.length > 0) {
                await saveSyncedVideos(newBreakingVideos);
                totalNewVideos += newBreakingVideos.length;
            }
            successfulSyncs++;

        } catch (error: any) {
            console.error(`Failed to sync breaking news for channel "${channel.name}":`, error.message);
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
