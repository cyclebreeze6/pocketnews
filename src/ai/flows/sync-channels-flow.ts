/**
 * @fileOverview Optimized flow to sync YouTube channels in batches to prevent cron timeouts.
 * Updated to support internal cursor-based state management and resilient processing.
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

    console.log(`[Sync Engine] Starting stateful run (Target Batch: ${batchSize})...`);
    await ensureTargetCategory();
    const firestore = adminSDK.firestore();
    
    // 1. Get previous cursor
    const stateDoc = await firestore.doc(STATE_DOC_PATH).get();
    const lastChannelId = stateDoc.exists ? stateDoc.data()?.lastChannelId : undefined;

    if (lastChannelId) {
        console.log(`[Sync Engine] Resuming from cursor: ${lastChannelId}`);
    } else {
        console.log(`[Sync Engine] Starting fresh loop from beginning.`);
    }

    // 2. Fetch next batch of channels
    const { channelsToSync, existingYoutubeIds, nextCursor } = await getChannelsForSync({ 
        onlyAutoSync: true,
        limit: batchSize,
        lastChannelId
    });
    
    if (channelsToSync.length === 0) {
      // If we physically reached the end but found no auto-sync channels, reset and restart
      if (nextCursor === undefined && lastChannelId) {
          console.log("[Sync Engine] Loop complete. Resetting cursor to start.");
          await firestore.doc(STATE_DOC_PATH).set({ lastChannelId: null, lastSyncAt: FieldValue.serverTimestamp() }, { merge: true });
          return { newVideosAdded: 0, syncedChannels: 0, message: "Loop reset." };
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
        console.log(`[Sync Engine] Processing wave ${Math.floor(i/concurrentBatchSize) + 1} of ${Math.ceil(channelsToSync.length/concurrentBatchSize)}...`);
        
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

                // Build regional tags
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
                console.error(`[Sync Engine] Channel "${channel.name}" failed:`, error.message);
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
        console.log(`[Sync Engine] Found ${videosToSave.length} new items. Saving to database...`);
        await saveSyncedVideos(videosToSave);
    } else {
        console.log("[Sync Engine] No new content found in this batch.");
    }

    // 5. Update cursor state for next run
    await firestore.doc(STATE_DOC_PATH).set({ 
        lastChannelId: nextCursor || null, 
        lastSyncAt: FieldValue.serverTimestamp(),
        lastBatchSize: channelsToSync.length,
        lastVideosFound: videosToSave.length,
        isLoopFinished: nextCursor === undefined
    }, { merge: true });

    console.log(`[Sync Engine] Batch complete. Next cursor: ${nextCursor || 'END (RESET)'}`);

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
    return syncChannelsStateful(50);
}
