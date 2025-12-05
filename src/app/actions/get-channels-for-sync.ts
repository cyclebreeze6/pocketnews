'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Channel } from '../../lib/types';
import 'dotenv/config';

// Initialize firebase-admin
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } else {
    // For local development, it might use default credentials if available
    initializeApp();
  }
}

/**
 * Fetches channels that need syncing and all existing YouTube video IDs.
 * This is a server action and should only be called from server-side code.
 * @param channelId - Optional ID to fetch a single channel.
 */
export async function getChannelsForSync(channelId?: string): Promise<{ channelsToSync: Channel[], existingYoutubeIds: string[] }> {
  const firestore = getFirestore();
  try {
    const channelsRef = firestore.collection('channels');
    let channelsToSync: Channel[] = [];

    if (channelId) {
        const doc = await channelsRef.doc(channelId).get();
        if (doc.exists && doc.data()?.youtubeChannelUrl) {
            channelsToSync.push({ id: doc.id, ...doc.data() } as Channel);
        }
    } else {
        const q = channelsRef.where('youtubeChannelUrl', '!=', null).where('youtubeChannelUrl', '!=', '');
        const channelSnapshot = await q.get();
        channelsToSync = channelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
    }
    
    if (channelsToSync.length === 0) {
        return { channelsToSync: [], existingYoutubeIds: [] };
    }
    
    // Fetch all existing video IDs to prevent duplicates
    const videosRef = firestore.collection('videos');
    const videosSnapshot = await videosRef.get();
    const existingYoutubeIds = videosSnapshot.docs.map(doc => doc.data().youtubeVideoId);

    return { channelsToSync, existingYoutubeIds };

  } catch (error) {
    console.error("Error fetching data for sync:", error);
    // In case of error, return empty arrays to prevent the whole sync from failing.
    return { channelsToSync: [], existingYoutubeIds: [] };
  }
}
