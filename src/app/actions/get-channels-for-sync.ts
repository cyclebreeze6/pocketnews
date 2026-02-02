'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Channel } from '../../lib/types';
import 'dotenv/config';

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing.
 * Also fetches all existing video YouTube IDs to prevent duplicates.
 * @param channelId - Optional ID to fetch a single channel.
 */
export async function getChannelsForSync(channelId?: string): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  const firestore = getFirestore(adminApp);
  
  // Fetch channels to be synced
  let channelsToSync: Channel[] = [];
  if (channelId) {
    const channelDoc = await firestore.collection('channels').doc(channelId).get();
    if (channelDoc.exists) {
      const channelData = channelDoc.data() as Channel;
      if (channelData.youtubeChannelUrl) {
        channelsToSync.push({ id: channelDoc.id, ...channelData });
      }
    }
  } else {
    const channelsSnapshot = await firestore.collection('channels').where('youtubeChannelUrl', '!=', null).get();
    channelsToSync = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
  }

  // Fetch all existing YouTube video IDs from the videos collection
  const videosSnapshot = await firestore.collection('videos').select('youtubeVideoId').get();
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
