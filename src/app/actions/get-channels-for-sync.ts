'use server';

import type { Channel } from '../../lib/types';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing using the Admin SDK.
 * Also fetches all existing video YouTube IDs to prevent duplicates.
 * @param channelId - Optional ID to fetch a single channel.
 */
export async function getChannelsForSync(channelId?: string): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  if (!isFirebaseAdminInitialized) {
    console.error("Firebase Admin SDK is not initialized. Cannot perform server-side sync.");
    return { channelsToSync: [], existingYoutubeIds: [] };
  }

  const firestore = adminSDK.firestore();
  
  // Fetch channels to be synced
  let channelsToSync: Channel[] = [];
  if (channelId) {
    const channelDocRef = firestore.collection('channels').doc(channelId);
    const channelDoc = await channelDocRef.get();
    if (channelDoc.exists) {
      const channelData = channelDoc.data() as Channel;
      if (channelData.youtubeChannelUrl) {
        channelsToSync.push({ id: channelDoc.id, ...channelData });
      }
    }
  } else {
    const channelsCollection = firestore.collection('channels');
    const channelsSnapshot = await channelsCollection.where('youtubeChannelUrl', '!=', null).get();
    channelsToSync = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
  }

  // Fetch all existing YouTube video IDs from the videos collection
  const videosCollection = firestore.collection('videos');
  const videosSnapshot = await videosCollection.get();
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
