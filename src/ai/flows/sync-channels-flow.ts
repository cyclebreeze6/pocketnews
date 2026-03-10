
/**
 * @fileOverview Flow to sync all enabled YouTube channels using the official YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'genkit';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideos } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { COUNTRY_TO_CONTINENT } from '../../lib/region-map';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const FetchResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos that were successfully added across all channels."),
  syncedChannels: z.number().describe("The number of channels that were successfully synced."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type FetchResult = z.infer<typeof FetchResultSchema>;

const TARGET_CATEGORY = 'Breaking News';

async function ensureTargetCategory() {
    if (!isFirebaseAdminInitialized) return;
    const firestore = adminSDK.firestore();
    const categoriesRef = firestore.collection('categories');
    const q = categoriesRef.where('name', '==', TARGET_CATEGORY);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        const newCategoryRef = categoriesRef.doc();
        await newCategoryRef.set({
            id: newCategoryRef.id,
            name: TARGET_CATEGORY,
            createdAt: FieldValue.serverTimestamp(),
        });
    }
}

export const fetchNewYouTubeVideosFlow = ai.defineFlow(
  {
    name: 'fetchNewYouTubeVideosFlow',
    outputSchema: FetchResultSchema,
  },
  async (): Promise<FetchResult> => {
    if (!isFirebaseAdminInitialized) {
        return { newVideosAdded: 0, syncedChannels: 0, errors: ["Firebase Admin SDK not initialized on server."] };
    }

    await ensureTargetCategory();

    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ onlyAutoSync: true });
    
    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0 };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    const errorMessages: string[] = [];
    const videosToSave: any[] = [];
    let successfulSyncs = 0;

    // Process in smaller batches to avoid overwhelming the network or API
    const batchSize = 10;
    for (let i = 0; i < channelsToSync.length; i += batchSize) {
        const chunk = channelsToSync.slice(i, i + batchSize);
        
        const results = await Promise.all(chunk.map(async (channel) => {
            if (!channel.youtubeChannelUrl) return null;
            
            try {
                const fetchedVideos = await fetchChannelVideos({ 
                    channelUrl: channel.youtubeChannelUrl, 
                    channelId: channel.youtubeChannelId,
                    maxResults: 1 
                });

                if (fetchedVideos.length === 0) {
                    return { success: true };
                }

                const latestVideo = fetchedVideos[0];

                if (existingIdsSet.has(latestVideo.videoId)) {
                    return { success: true };
                }

                const videoRegions = [...(channel.region || ['Global'])];
                videoRegions.forEach(r => {
                    const continent = COUNTRY_TO_CONTINENT[r];
                    if (continent && !videoRegions.includes(continent)) {
                        videoRegions.push(continent);
                    }
                });

                const videoData = {
                    youtubeVideoId: latestVideo.videoId,
                    title: latestVideo.title,
                    description: latestVideo.description,
                    thumbnailUrl: latestVideo.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: TARGET_CATEGORY,
                    views: Math.floor(Math.random() * 1000),
                    watchTime: Math.floor(Math.random() * 100),
                    regions: videoRegions,
                };
                
                return { success: true, video: videoData };

            } catch (error: any) {
                console.error(`Failed to auto-sync channel "${channel.name}":`, error.message);
                return { success: false, error: `Channel "${channel.name}": ${error.message}` };
            }
        }));

        for (const result of results) {
            if (!result) continue;
            if (result.success) {
                successfulSyncs++;
                if (result.video) {
                    videosToSave.push(result.video);
                    existingIdsSet.add(result.video.youtubeVideoId);
                }
            } else if (result.error) {
                errorMessages.push(result.error);
            }
        }
    }

    if (videosToSave.length > 0) {
        await saveSyncedVideos(videosToSave);
    }

    return {
      newVideosAdded: videosToSave.length,
      syncedChannels: successfulSyncs,
      errors: errorMessages.length > 0 ? errorMessages : undefined,
    };
  }
);
