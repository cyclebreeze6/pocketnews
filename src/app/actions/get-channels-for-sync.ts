'use server';

import type { Channel } from '../../lib/types';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing using the Admin SDK.
 * Optimized to prevent Firestore query errors (range vs order by conflicts).
 * Uses in-memory filtering for robustness with libraries under 1000 items.
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
    // FETCH LOGIC:
    // We fetch a larger slice than requested to account for channels that might be filtered out in-code.
    // For ~70 channels, fetching 100 is instant and reliable.
    const fetchLimit = options?.limit ? Math.max(options.limit * 2, 50) : 100;

    let channelsQuery = firestore.collection('channels')
        .orderBy(adminSDK.firestore.FieldPath.documentId(), 'asc')
        .limit(fetchLimit);

    if (options?.lastChannelId) {
        channelsQuery = channelsQuery.startAfter(options.lastChannelId);
    }

    const snapshot = await channelsQuery.get();
    const allFetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
    
    // Filter in-memory to avoid complex index requirements
    channelsToSync = allFetched.filter(c => {
        const hasUrl = !!c.youtubeChannelUrl;
        const autoSyncMatch = options?.onlyAutoSync ? c.isAutoSyncEnabled === true : true;
        return hasUrl && autoSyncMatch;
    });

    // Enforce the requested limit if provided
    if (options?.limit && channelsToSync.length > options.limit) {
        channelsToSync = channelsToSync.slice(0, options.limit);
        // Next run starts after the LAST item we actually processed
        nextCursor = channelsToSync[channelsToSync.length - 1].id;
    } else if (snapshot.docs.length > 0) {
        // Otherwise, move cursor to the end of this physical batch
        nextCursor = snapshot.docs[snapshot.docs.length - 1].id;
    }

    // Reset Signal: If we fetched fewer than the limit, we've exhausted the library
    if (snapshot.docs.length < fetchLimit) {
        nextCursor = undefined; 
    }

    console.log(`[Sync] Queried ${snapshot.docs.length} docs. Found ${channelsToSync.length} actionable sources.`);
  }

  // Fetch recent video IDs to prevent duplicates (last 1000 items is sufficient)
  const videosSnapshot = await firestore.collection('videos')
    .orderBy('createdAt', 'desc')
    .limit(1000)
    .select('youtubeVideoId')
    .get();
    
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds, nextCursor };
}
