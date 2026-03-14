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
    console.error("Firebase Admin SDK is not initialized.");
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
    let query: any = firestore.collection('channels');
    if (options?.onlyAutoSync) {
      query = query.where('isAutoSyncEnabled', '==', true);
    } else {
      query = query.where('youtubeChannelUrl', '!=', null);
    }
    
    const snapshot = await query.get();
    channelsToSync = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        .filter(c => !!c.youtubeChannelUrl);

    // Optimized Alphabetical filtering logic
    if (options?.nameStart || options?.nameEnd) {
        channelsToSync = channelsToSync.filter(channel => {
            const firstChar = (channel.name || '').charAt(0).toUpperCase();
            
            // Group A logic (A-L): Includes everything from start of index up to 'L'
            if (options.nameStart === 'A' && options.nameEnd === 'L') {
                return firstChar <= 'L' || (firstChar < 'A');
            }
            
            // Group B logic (M-Z): Includes everything starting from 'M' to the end
            if (options.nameStart === 'M' && options.nameEnd === 'Z') {
                return firstChar >= 'M';
            }

            return true;
        });
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
