'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelShorts } from '../../ai/flows/youtube-channel-shorts-flow';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Manually triggers a sync of YouTube Shorts for all active auto-sync channels.
 */
export async function syncShortsAction(): Promise<{ count: number; synced: number }> {
    if (!isFirebaseAdminInitialized) {
        throw new Error("Admin SDK not initialized.");
    }

    const { channelsToSync } = await getChannelsForSync({ onlyAutoSync: true });
    
    if (channelsToSync.length === 0) {
        return { count: 0, synced: 0 };
    }

    const db = adminSDK.firestore();
    
    // Fetch recent short IDs to prevent duplicates (limit to 500 for speed)
    const existingShortsSnap = await db.collection('shorts')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();
    
    const existingIds = new Set(existingShortsSnap.docs.map(doc => doc.data().youtubeVideoId));
    
    let addedCount = 0;
    let syncedChannels = 0;

    // Process channels in small parallel chunks to stay under timeout limits
    const batchSize = 10;
    for (let i = 0; i < channelsToSync.length; i += batchSize) {
        const chunk = channelsToSync.slice(i, i + batchSize);
        
        await Promise.all(chunk.map(async (channel) => {
            if (!channel.youtubeChannelUrl) return;
            
            try {
                // Fetch 3 most recent shorts per channel
                const shorts = await fetchChannelShorts({ 
                    channelUrl: channel.youtubeChannelUrl, 
                    maxResults: 3 
                });

                const newShorts = shorts.filter(s => !existingIds.has(s.youtubeVideoId));
                
                if (newShorts.length > 0) {
                    const batch = db.batch();
                    newShorts.forEach(short => {
                        const docRef = db.collection('shorts').doc();
                        batch.set(docRef, {
                            ...short,
                            id: docRef.id,
                            channelId: channel.id,
                            creatorId: 'system-auto-sync',
                            createdAt: FieldValue.serverTimestamp(),
                        });
                        addedCount++;
                    });
                    await batch.commit();
                }
                syncedChannels++;
            } catch (error: any) {
                console.error(`Shorts sync failed for ${channel.name}:`, error.message);
            }
        }));
    }

    return { count: addedCount, synced: syncedChannels };
}
