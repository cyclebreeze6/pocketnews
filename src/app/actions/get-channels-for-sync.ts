
'use server';

import type { Channel } from '../../lib/types';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing using the Admin SDK.
 * Also fetches all existing video YouTube IDs to prevent duplicates.
 * @param options - Configuration for fetching channels.
 */
export async function getChannelsForSync(options?: { 
  channelId?: string, 
  onlyAutoSync?: boolean 
}): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  if (!isFirebaseAdminInitialized) {
    console.error("Firebase Admin SDK is not initialized. Cannot perform server-side sync.");
    return { channelsToSync: [], existingYoutubeIds: [] };
  }

  const firestore = adminSDK.firestore();
  
  // Fetch channels to be synced
  let channelsToSync: Channel[] = [];
  
  if (options?.channelId) {
    const channelDocRef = firestore.collection('channels').doc(options.channelId);
    const channelDoc = await channelDocRef.get();
    if (channelDoc.exists) {
      const channelData = channelDoc.data() as Channel;
      if (channelData.youtubeChannelUrl) {
        channelsToSync.push({ id: channelDoc.id, ...channelData });
      }
    }
  } else {
    // We simplify the query here to avoid complex composite index requirements.
    // If we want auto-sync only, we filter by that boolean flag first.
    let query: any = firestore.collection('channels');
    
    if (options?.onlyAutoSync) {
      query = query.where('isAutoSyncEnabled', '==', true);
    } else {
      query = query.where('youtubeChannelUrl', '!=', null);
    }
    
    const channelsSnapshot = await query.get();
    channelsToSync = channelsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        // Secondary safety check for URL
        .filter(c => !!c.youtubeChannelUrl);
  }

  // Fetch all existing YouTube video IDs from the videos collection
  const videosCollection = firestore.collection('videos');
  const videosSnapshot = await videosCollection.select('youtubeVideoId').get();
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
