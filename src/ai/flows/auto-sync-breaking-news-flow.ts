
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
    const errorMessages: string[] = [];
    const videosToSave: any[] = [];
    let successfulSyncs = 0;

    // Process in batches to prevent timeouts
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

                const videoData = {
                    youtubeVideoId: latestVideo.videoId,
                    title: latestVideo.title,
                    description: latestVideo.description,
                    thumbnailUrl: latestVideo.thumbnailUrl,
                    channelId: channel.id,
                    contentCategory: BREAKING_NEWS_CATEGORY,
                    views: Math.floor(Math.random() * 10000),
                    watchTime: Math.floor(Math.random() * 100),
                    regions: channel.region || ['Global'],
                };
                
                return { success: true, video: videoData };

            } catch (error: any) {
                console.error(`Failed to sync breaking news for channel "${channel.name}":`, error.message);
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
