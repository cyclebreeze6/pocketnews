'use server';

import type { Channel } from '../../lib/types';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing using the Admin SDK.
 * Optimizes performance by pre-filtering and providing unique IDs.
 * Supports alphabetical range filtering to prevent cron timeouts.
 */
export async function getChannelsForSync(options?: { 
  channelId?: string, 
  onlyAutoSync?: boolean,
  nameStart?: string,
  nameEnd?: string
}): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  if (!isFirebaseAdminInitialized) {
    console.error("[Sync] Firebase Admin SDK is not initialized.");
    return { channelsToSync: [], existingYoutubeIds: [] };
  }

  const firestore = adminSDK.firestore();
  let channelsToSync: Channel[] = [];
  
  if (options?.channelId) {
    const channelDoc = await firestore.collection('channels').doc(options.channelId).get();
    if (channelDoc.exists) {
      const data = channelDoc.data() as Channel;
      if (data.youtubeChannelUrl) channelsToSync.push({ id: channelDoc.id, ...data });
    }
  } else {
    // Fetch all channels with a YouTube URL first, then filter locally to ensure consistency
    // querying by boolean 'true' can sometimes skip docs where the field is missing
    const snapshot = await firestore.collection('channels').get();
    
    channelsToSync = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        .filter(c => {
            const hasUrl = !!c.youtubeChannelUrl;
            if (!hasUrl) return false;
            
            // If onlyAutoSync is requested, check the flag (allow missing to be false)
            if (options?.onlyAutoSync && c.isAutoSyncEnabled !== true) return false;
            
            return true;
        });

    console.log(`[Sync] Found ${channelsToSync.length} total channels meeting URL criteria.`);

    // Optimized Alphabetical filtering logic
    if (options?.nameStart || options?.nameEnd) {
        channelsToSync = channelsToSync.filter(channel => {
            const name = channel.name || 'Unknown';
            const firstChar = name.charAt(0).toUpperCase();
            
            // Group A logic (A-L): Includes everything from start of index up to 'L'
            // This covers numbers and special characters as well (which are < 'A')
            if (options.nameStart === 'A' && options.nameEnd === 'L') {
                return firstChar <= 'L';
            }
            
            // Group B logic (M-Z): Includes everything starting from 'M' to the end
            if (options.nameStart === 'M' && options.nameEnd === 'Z') {
                return firstChar >= 'M';
            }

            return true;
        });
        console.log(`[Sync] Filtered to ${channelsToSync.length} channels for range ${options.nameStart}-${options.nameEnd}.`);
    }
  }

  // Only fetch the last 1000 video IDs to prevent timeouts
  const videosSnapshot = await firestore.collection('videos')
    .orderBy('createdAt', 'desc')
    .limit(1000)
    .select('youtubeVideoId')
    .get();
    
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
