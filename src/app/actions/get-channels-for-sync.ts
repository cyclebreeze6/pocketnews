
'use server';

import type { Channel } from '../../lib/types';
import { getFirestore, collection, doc, getDoc, where, query, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '../../firebase';

/**
 * Fetches channels that have a `youtubeChannelUrl` for syncing.
 * Also fetches all existing video YouTube IDs to prevent duplicates.
 * @param channelId - Optional ID to fetch a single channel.
 */
export async function getChannelsForSync(channelId?: string): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  // Use the client-side SDK for read-only operations.
  const { firestore } = initializeFirebase();
  
  // Fetch channels to be synced
  let channelsToSync: Channel[] = [];
  if (channelId) {
    const channelDocRef = doc(firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);
    if (channelDoc.exists()) {
      const channelData = channelDoc.data() as Channel;
      if (channelData.youtubeChannelUrl) {
        channelsToSync.push({ id: channelDoc.id, ...channelData });
      }
    }
  } else {
    const channelsCollection = collection(firestore, 'channels');
    const q = query(channelsCollection, where('youtubeChannelUrl', '!=', null));
    const channelsSnapshot = await getDocs(q);
    channelsToSync = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
  }

  // Fetch all existing YouTube video IDs from the videos collection
  const videosCollection = collection(firestore, 'videos');
  const videosQuery = query(videosCollection);
  const videosSnapshot = await getDocs(videosQuery);
  const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

  return { channelsToSync, existingYoutubeIds };
}
