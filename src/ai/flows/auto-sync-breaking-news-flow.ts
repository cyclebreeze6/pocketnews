/**
 * @fileOverview logic to automatically sync breaking news from configured channels using the YouTube Data API.
 */
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideos } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const BREAKING_NEWS_CATEGORY = 'Breaking News';

async function ensureBreakingNewsCategory() {
    if (!isFirebaseAdminInitialized) return;
    const firestore = adminSDK.firestore();
    const categoriesRef = firestore.collection('categories');
    const q = categoriesRef.where('name', '==', BREAKING_NEWS_CATEGORY);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        const newCategoryRef = categoriesRef.doc();
        await newCategoryRef.set({
            id: newCategoryRef.id,
            name: BREAKING_NEWS_CATEGORY,
            createdAt: FieldValue.serverTimestamp(),
        });
    }
}

export async function runAutoSync() {
    if (!isFirebaseAdminInitialized) {
        return { newVideosAdded: 0, syncedChannels: 0, errors: ["Admin SDK not initialized."] };
    }
    
    await ensureBreakingNewsCategory();

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
            // Using direct function instead of flow to avoid metadata errors
            const fetchedVideos = await fetchChannelVideos({ 
                channelUrl: channel.youtubeChannelUrl, 
                channelId: channel.youtubeChannelId,
                maxResults: 1 
            });

            const newBreakingVideos = fetchedVideos
                .filter(video => !existingIdsSet.has(video.videoId))
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: BREAKING_NEWS_CATEGORY,
                    views: Math.floor(Math.random() * 10000),
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
