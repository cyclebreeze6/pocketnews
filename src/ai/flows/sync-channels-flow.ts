'use server';
/**
 * @fileOverview A flow for syncing new videos from multiple YouTube channels.
 * 
 * - syncYouTubeChannelsFlow - The main function to trigger the sync process.
 * - SyncResult - The output type detailing how many videos were synced.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import type { YouTubeVideoDetails } from './youtube-channel-videos-flow';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, type App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import type { Channel } from '@/lib/types';
import 'dotenv/config';


// Server-side only Firebase Admin initialization
function initializeFirebaseAdmin(): App {
  if (getAdminApps().length > 0) {
    return getAdminApp();
  }
  // If your server runs in a GCP environment (like Cloud Run, App Engine),
  // it can automatically detect the project's service account credentials.
  return initializeAdminApp();
}

const SyncResultSchema = z.object({
  syncedChannels: z.number().describe('The number of channels that were checked for new content.'),
  newVideosAdded: z.number().describe('The total number of new videos added across all channels.'),
  errors: z.array(z.string()).describe('A list of errors encountered during the sync process.'),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;


const syncChannelsFlow = ai.defineFlow(
  {
    name: 'syncChannelsFlow',
    outputSchema: SyncResultSchema,
  },
  async () => {
    const adminApp = initializeFirebaseAdmin();
    const firestore = getAdminFirestore(adminApp);
    
    let syncedChannels = 0;
    let newVideosAdded = 0;
    const errors: string[] = [];

    // 1. Get all internal channels that have a youtubeChannelUrl
    const channelsRef = firestore.collection('channels');
    const q = channelsRef.where('youtubeChannelUrl', '!=', null).where('youtubeChannelUrl', '!=', '');
    const channelSnapshot = await q.get();
    const channelsToSync = channelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
    
    if (channelsToSync.length === 0) {
        return { syncedChannels: 0, newVideosAdded: 0, errors: ["No channels are configured for syncing. Please add a YouTube Channel URL to one or more channels."] };
    }

    // 2. Get all existing video YouTube IDs from our database to avoid duplicates
    const videosRef = firestore.collection('videos');
    const existingVideosSnapshot = await videosRef.get();
    const existingYoutubeIds = new Set(existingVideosSnapshot.docs.map(doc => doc.data().youtubeVideoId));

    // 3. Loop through each channel and sync videos
    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;

        try {
            // 3a. Fetch latest videos from the YouTube channel RSS feed
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });
            syncedChannels++;

            // 3b. Filter out videos that already exist in our database
            const newVideos = fetchedVideos.filter(video => !existingYoutubeIds.has(video.videoId));

            if (newVideos.length === 0) continue;
            
            const videosCollectionRef = firestore.collection('videos');
            const batch = firestore.batch();

            // 3c. Add new videos to the database
            for (const videoData of newVideos) {
                const newDocRef = videosCollectionRef.doc(); // Create a new doc reference
                const videoDoc = {
                    id: newDocRef.id,
                    youtubeVideoId: videoData.videoId,
                    title: videoData.title,
                    description: videoData.description,
                    thumbnailUrl: videoData.thumbnailUrl,
                    channelId: channel.id, // Assign to the internal channel
                    contentCategory: 'Uncategorized', // Default category
                    createdAt: new Date(), // Use current date for server timestamp
                    uploadDate: new Date().toISOString(),
                    views: Math.floor(Math.random() * 100), // Start with some random low views
                    watchTime: Math.floor(Math.random() * 100),
                };

                batch.set(newDocRef, videoDoc);
                newVideosAdded++;
                existingYoutubeIds.add(videoData.videoId); // Add to set to prevent re-adding in same run
            }

            await batch.commit();

        } catch (error: any) {
            console.error(`Failed to sync channel "${channel.name}":`, error);
            errors.push(`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`);
        }
    }

    return { syncedChannels, newVideosAdded, errors };
  }
);

export async function syncYouTubeChannels(): Promise<SyncResult> {
  return syncChannelsFlow();
}
