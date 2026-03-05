
/**
 * @fileOverview Flow to sync all enabled YouTube channels and add new videos.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { COUNTRY_TO_CONTINENT } from '../../lib/region-map';

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
    // Fetch channels enabled for auto-sync via the Admin Panel
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ onlyAutoSync: true });
    
    if (channelsToSync.length === 0) {
      console.log("Auto-sync: No channels currently enabled for monitoring.");
      return { newVideosAdded: 0, syncedChannels: 0 };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    let totalNewVideos = 0;
    let successfulSyncs = 0;
    const errorMessages: string[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            // Fetch ONLY the single most recent video to keep the site lean
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 1 });

            if (fetchedVideos.length === 0) {
                console.log(`Auto-sync: No videos found for channel "${channel.name}".`);
                successfulSyncs++;
                continue;
            }

            const latestVideo = fetchedVideos[0];

            // Deduplication logic: skip if videoId already exists in our database
            if (existingIdsSet.has(latestVideo.videoId)) {
                console.log(`Auto-sync: Latest video for "${channel.name}" already published. Skipping.`);
                successfulSyncs++;
                continue;
            }

            // Group country into continent automatically for broader region filtering
            const videoRegions = [...(channel.region || ['Global'])];
            videoRegions.forEach(r => {
                const continent = COUNTRY_TO_CONTINENT[r];
                if (continent && !videoRegions.includes(continent)) {
                    videoRegions.push(continent);
                }
            });

            const videoToSave = {
                youtubeVideoId: latestVideo.videoId,
                title: latestVideo.title,
                description: latestVideo.description,
                thumbnailUrl: latestVideo.thumbnailUrl,
                channelId: channel.id,
                contentCategory: 'News', // Default category for auto-sync
                views: Math.floor(Math.random() * 1000),
                watchTime: Math.floor(Math.random() * 100),
                regions: videoRegions,
            };
            
            await saveSyncedVideos([videoToSave]);
            
            // Update tracking
            existingIdsSet.add(latestVideo.videoId);
            totalNewVideos++;
            successfulSyncs++;
            console.log(`Auto-sync: Published new video "${latestVideo.title}" from "${channel.name}".`);

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
