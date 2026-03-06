/**
 * @fileOverview Flow to sync all enabled YouTube channels using the official YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'genkit';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
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
    let totalNewVideos = 0;
    let successfulSyncs = 0;
    const errorMessages: string[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            // Using the API-based flow
            const fetchedVideos = await fetchChannelVideosFlow({ 
                channelUrl: channel.youtubeChannelUrl, 
                channelId: channel.youtubeChannelId,
                maxResults: 1 
            });

            if (fetchedVideos.length === 0) {
                successfulSyncs++;
                continue;
            }

            const latestVideo = fetchedVideos[0];

            if (existingIdsSet.has(latestVideo.videoId)) {
                successfulSyncs++;
                continue;
            }

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
                contentCategory: TARGET_CATEGORY,
                views: Math.floor(Math.random() * 1000),
                watchTime: Math.floor(Math.random() * 100),
                regions: videoRegions,
            };
            
            await saveSyncedVideos([videoToSave]);
            
            existingIdsSet.add(latestVideo.videoId);
            totalNewVideos++;
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
