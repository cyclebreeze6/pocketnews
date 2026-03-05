/**
 * @fileOverview Flow to sync selected YouTube channels and add new videos.
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

// Strictly restricted to the user's requested news channels
const AUTHORIZED_NEWS_CHANNELS = [
  'cnn', 
  'aljazeera', 
  'al jazeera',
  'cbs', 
  'fox news', 
  'arise news', 
  'channels television', 
  'channels news',
  'channels',
  'itv', 
  'dw news', 
  'nbc news', 
  'euronews'
];

export const fetchNewYouTubeVideosFlow = ai.defineFlow(
  {
    name: 'fetchNewYouTubeVideosFlow',
    outputSchema: FetchResultSchema,
  },
  async (): Promise<FetchResult> => {
    // Fetch channels enabled for auto-sync
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ onlyAutoSync: true });
    
    // Filter channels to strictly match the authorized news list
    const filteredChannels = channelsToSync.filter(channel => 
      channel.name && AUTHORIZED_NEWS_CHANNELS.some(name => channel.name.toLowerCase().includes(name))
    );

    if (filteredChannels.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0, errors: ["No authorized news channels are currently enabled for auto-sync."] };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    let totalNewVideos = 0;
    let successfulSyncs = 0;
    const errorMessages: string[] = [];

    for (const channel of filteredChannels) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            // Fetch ONLY the single most recent video
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 1 });

            // Deduplication logic: skip if videoId already exists in our database
            const newVideosToSave = fetchedVideos
                .filter(video => !existingIdsSet.has(video.videoId))
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: 'News', // Default category for auto-sync
                    views: Math.floor(Math.random() * 1000),
                    watchTime: Math.floor(Math.random() * 100),
                    regions: channel.region || ['Global'],
                }));
            
            if (newVideosToSave.length > 0) {
                await saveSyncedVideos(newVideosToSave);
                totalNewVideos += newVideosToSave.length;
            }
            successfulSyncs++;

        } catch (error: any) {
            console.error(`Failed to auto-sync channel "${channel.name}":`, error.message);
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
