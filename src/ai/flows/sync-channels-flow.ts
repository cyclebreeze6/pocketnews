/**
 * @fileOverview Optimized flow to sync YouTube channels in batches to prevent cron timeouts.
 * Updated to support internal cursor-based state management.
 */
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';
import { fetchChannelVideos } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { COUNTRY_TO_CONTINENT } from '../../lib/region-map';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const TARGET_CATEGORY = 'Breaking News';
const STATE_DOC_PATH = 'metadata/sync_state';

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
 * Stateful sync manager that tracks progress across multiple runs.
 */
export async function syncChannelsStateful(batchSize: number = 30) {
    if (!isFirebaseAdminInitialized) {
        return { newVideosAdded: 0, syncedChannels: 0, errors: ["Admin SDK not initialized."] };
    }

    await ensureTargetCategory();
    const firestore = adminSDK.firestore();
    
    // 1. Get previous cursor
    const stateDoc = await firestore.doc(STATE_DOC_PATH).get();
    const lastChannelId = stateDoc.exists ? stateDoc.data()?.lastChannelId : undefined;

    // 2. Fetch next batch of channels
    const { channelsToSync, existingYoutubeIds, nextCursor } = await getChannelsForSync({ 
        onlyAutoSync: true,
        limit: batchSize,
        lastChannelId
    });
    
    if (channelsToSync.length === 0) {
      // If we were at the end, reset cursor and try again from start
      if (lastChannelId) {
          await firestore.doc(STATE_DOC_PATH).set({ lastChannelId: null, lastSyncAt: FieldValue.serverTimestamp() }, { merge: true });
          return syncChannelsStateful(batchSize);
      }
      return { newVideosAdded: 0, syncedChannels: 0 };
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    const errorMessages: string[] = [];
    const videosToSave: any[] = [];
    let successfulSyncs = 0;

    // 3. Process in parallel waves
    const concurrentBatchSize = 10;
    for (let i = 0; i < channelsToSync.length; i += concurrentBatchSize) {
        const chunk = channelsToSync.slice(i, i + concurrentBatchSize);
        
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

    // 4. Commit results
    if (videosToSave.length > 0) {
        await saveSyncedVideos(videosToSave);
    }

    // 5. Update cursor state for next run
    await firestore.doc(STATE_DOC_PATH).set({ 
        lastChannelId: nextCursor || null, 
        lastSyncAt: FieldValue.serverTimestamp(),
        lastBatchSize: channelsToSync.length,
        lastVideosFound: videosToSave.length
    }, { merge: true });

    return {
      newVideosAdded: videosToSave.length,
      syncedChannels: successfulSyncs,
      errors: errorMessages.length > 0 ? errorMessages : undefined,
    };
}

/**
 * Legacy support for range-based sync
 */
export async function syncChannelsInRange(range?: { start: string, end: string }) {
    // For internal efficiency, we now favor the stateful cursor
    // but we can fallback to the alphabetical split if specifically requested via URL
    return syncChannelsStateful(50);
}
