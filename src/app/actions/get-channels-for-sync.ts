
'use server';

import type { Channel } from '../../lib/types';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing using the Admin SDK.
 * Optimizes performance by pre-filtering and providing unique IDs.
 */
export async function getChannelsForSync(options?: { 
  channelId?: string, 
  onlyAutoSync?: boolean 
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
  }

  // Optimized select to only fetch IDs, saving read costs
  const videosSnapshot = await firestore.collection('videos').select('youtubeVideoId').get();
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
