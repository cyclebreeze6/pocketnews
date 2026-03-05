/**
 * @fileOverview Flow to automatically sync breaking news from configured channels.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const AutoSyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos added as Breaking News."),
  syncedChannels: z.number().describe("The number of channels that were processed."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type AutoSyncResult = z.infer<typeof AutoSyncResultSchema>;

// A list of major news outlets to be considered for "Breaking News"
const BREAKING_NEWS_CHANNEL_NAMES = [
  'cnn', 
  'aljazeera',
  'al jazeera english',
  'fox news', 
  'abc news', 
  'africa news', 
  'channels news',
  'channels television',
  'cbs news', 
  'sky news', 
  'reuters'
];

const BREAKING_NEWS_CATEGORY = 'Breaking News';

async function ensureBreakingNewsCategory() {
    if (!isFirebaseAdminInitialized) {
        console.warn("Firebase Admin SDK is not initialized. Cannot ensure 'Breaking News' category exists.");
        return;
    }
    const firestore = adminSDK.firestore();
    const categoriesRef = firestore.collection('categories');
    const q = categoriesRef.where('name', '==', BREAKING_NEWS_CATEGORY);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        console.log(`'${BREAKING_NEWS_CATEGORY}' category not found. Creating it...`);
        const newCategoryRef = categoriesRef.doc();
        await newCategoryRef.set({
            id: newCategoryRef.id,
            name: BREAKING_NEWS_CATEGORY,
            createdAt: FieldValue.serverTimestamp(),
        });
        console.log(`'${BREAKING_NEWS_CATEGORY}' category created.`);
    }
}


async function runAutoSync(): Promise<AutoSyncResult> {
    if (!isFirebaseAdminInitialized) {
        const errorMsg = "Auto-sync failed: Firebase Admin SDK is not configured on the server. Please provide service account credentials.";
        console.error(errorMsg);
        return { newVideosAdded: 0, syncedChannels: 0, errors: [errorMsg] };
    }
    
    await ensureBreakingNewsCategory();

    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();
    
    const breakingNewsChannels = channelsToSync.filter(c => 
      c.name && BREAKING_NEWS_CHANNEL_NAMES.some(name => c.name.toLowerCase().includes(name))
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
            // Fetch ONLY the single most recent video for breaking news as well
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 1 });

            const newBreakingVideos = fetchedVideos
                .filter(video => !existingIdsSet.has(video.videoId))
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: BREAKING_NEWS_CATEGORY,
                    views: Math.floor(Math.random() * 1000),
                    watchTime: Math.floor(Math.random() * 100),
                    regions: channel.region || ['Global'],
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
