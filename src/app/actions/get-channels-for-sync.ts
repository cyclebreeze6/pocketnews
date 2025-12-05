'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '../../firebase';
import type { Channel } from '../../lib/types';

/**
 * Fetches channels that need syncing and all existing YouTube video IDs.
 * This is a server action and should only be called from server-side code.
 */
export async function getChannelsForSync(): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  try {
    const { firestore } = initializeFirebase();
    
    // Fetch channels with a youtubeChannelUrl
    const channelsRef = collection(firestore, 'channels');
    const q = query(channelsRef, where('youtubeChannelUrl', '!=', null), where('youtubeChannelUrl', '!=', ''));
    const channelSnapshot = await getDocs(q);
    const channelsToSync = channelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));

    // Fetch all existing video IDs to prevent duplicates
    const videosRef = collection(firestore, 'videos');
    const existingVideosSnapshot = await getDocs(videosRef);
    const existingYoutubeIds = existingVideosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

    return { channelsToSync, existingYoutubeIds };

  } catch (error) {
    console.error("Error fetching data for sync:", error);
    // In case of error, return empty arrays to prevent the whole sync from failing.
    return { channelsToSync: [], existingYoutubeIds: [] };
  }
}
