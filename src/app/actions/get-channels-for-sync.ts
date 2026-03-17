'use server';

import type { Channel } from '../../lib/types';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing using the Admin SDK.
 * Optimizes performance by pre-filtering and providing unique IDs.
 * Supports stateful cursor-based sync to prevent duplicates and timeouts.
 */
export async function getChannelsForSync(options?: { 
  channelId?: string, 
  onlyAutoSync?: boolean,
  limit?: number,
  lastChannelId?: string
}): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[], nextCursor?: string }> {
  if (!isFirebaseAdminInitialized) {
    console.error("[Sync] Firebase Admin SDK is not initialized.");
    return { channelsToSync: [], existingYoutubeIds: [] };
  }

  const firestore = adminSDK.firestore();
  let channelsToSync: Channel[] = [];
  let nextCursor: string | undefined;
  
  if (options?.channelId) {
    const channelDoc = await firestore.collection('channels').doc(options.channelId).get();
    if (channelDoc.exists) {
      const data = channelDoc.data() as Channel;
      if (data.youtubeChannelUrl) channelsToSync.push({ id: channelDoc.id, ...data });
    }
  } else {
    // Stateful Query: Fetch channels ordered by ID starting after the last one processed
    let channelsQuery = firestore.collection('channels')
        .where('youtubeChannelUrl', '>=', '') // Ensure has URL
        .orderBy('id', 'asc');

    if (options?.lastChannelId) {
        channelsQuery = channelsQuery.startAfter(options.lastChannelId);
    }

    if (options?.limit) {
        channelsQuery = channelsQuery.limit(options.limit);
    }

    const snapshot = await channelsQuery.get();
    
    channelsToSync = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        .filter(c => {
            if (options?.onlyAutoSync && c.isAutoSyncEnabled !== true) return false;
            return true;
        });

    if (snapshot.docs.length > 0) {
        nextCursor = snapshot.docs[snapshot.docs.length - 1].id;
    }

    // If we reached the end but have more channels in total, next run starts from beginning
    if (options?.limit && snapshot.docs.length < options.limit) {
        nextCursor = undefined; // Signal to reset cursor in sync state
    }

    console.log(`[Sync] Found ${channelsToSync.length} channels for this stateful batch.`);
  }

  // Only fetch the last 1000 video IDs to prevent timeouts
  const videosSnapshot = await firestore.collection('videos')
    .orderBy('createdAt', 'desc')
    .limit(1000)
    .select('youtubeVideoId')
    .get();
    
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds, nextCursor };
}
