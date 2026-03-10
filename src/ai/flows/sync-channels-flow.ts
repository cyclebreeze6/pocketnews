/**
 * @fileOverview Optimized flow to sync YouTube channels in batches to prevent cron timeouts.
 */
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideos } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { COUNTRY_TO_CONTINENT } from '../../lib/region-map';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

/**
 * High-performance sync function that supports range filtering for cron stability.
 */
export async function syncChannelsInRange(range?: { start: string, end: string }) {
    if (!isFirebaseAdminInitialized) {
        return { newVideosAdded: 0, syncedChannels: 0, errors: ["Admin SDK not initialized."] };
    }

    await ensureTargetCategory();

    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ 
        onlyAutoSync: true,
        nameStart: range?.start,
        nameEnd: range?.end
    });
    
    if (channelsToSync.length === 0) {
      return { newVideosAdded: 0, syncedChannels: 0 };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    const errorMessages: string[] = [];
    const videosToSave: any[] = [];
    let successfulSyncs = 0;

    // Process in waves of 25 to maximize throughput
    const batchSize = 25;
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

                if (fetchedVideos.length === 0) return { success: true };

                const latest = fetchedVideos[0];
                if (existingIdsSet.has(latest.videoId)) return { success: true };

                const videoRegions = [...(channel.region || ['Global'])];
                videoRegions.forEach(r => {
                    const continent = COUNTRY_TO_CONTINENT[r];
                    if (continent && !videoRegions.includes(continent)) {
                        videoRegions.push(continent);
                    }
                });

                return { 
                    success: true, 
                    video: {
                        youtubeVideoId: latest.videoId,
                        title: latest.title,
                        description: latest.description,
                        thumbnailUrl: latest.thumbnailUrl,
                        channelId: channel.id,
                        contentCategory: TARGET_CATEGORY,
                        views: Math.floor(Math.random() * 1000),
                        watchTime: Math.floor(Math.random() * 100),
                        regions: videoRegions,
                    }
                };

            } catch (error: any) {
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
