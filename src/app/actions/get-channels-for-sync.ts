'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '../../firebase';
import type { Channel } from '../../lib/types';

/**
 * Fetches channels from Firestore that have a YouTube channel URL configured for syncing.
 * This is a server action and should only be called from server-side code.
 */
export async function getChannelsForSync(): Promise<Channel[]> {
  try {
    const { firestore } = initializeFirebase();
    const channelsRef = collection(firestore, 'channels');
    const q = query(channelsRef, where('youtubeChannelUrl', '!=', null), where('youtubeChannelUrl', '!=', ''));
    const channelSnapshot = await getDocs(q);
    
    if (channelSnapshot.empty) {
      return [];
    }

    return channelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
  } catch (error) {
    console.error("Error fetching channels for sync:", error);
    // In case of error, return an empty array to prevent the whole sync from failing.
    // The error will be logged on the server.
    return [];
  }
}
