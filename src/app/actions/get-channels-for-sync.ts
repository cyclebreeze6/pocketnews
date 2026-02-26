
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
    let query: any = firestore.collection('channels').where('youtubeChannelUrl', '!=', null);
    
    // If onlyAutoSync is requested, filter by that flag
    if (options?.onlyAutoSync) {
      query = query.where('isAutoSyncEnabled', '==', true);
    }
    
    const channelsSnapshot = await query.get();
    channelsToSync = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
  }

  // Fetch all existing YouTube video IDs from the videos collection
  // Note: For large datasets, this should be paginated or checked per video, 
  // but for MVP this is efficient enough.
  const videosCollection = firestore.collection('videos');
  const videosSnapshot = await videosCollection.select('youtubeVideoId').get();
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
