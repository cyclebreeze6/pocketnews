'use server';
/**
 * @fileOverview A flow for syncing new videos from a single YouTube channel.
 *
 * - syncSingleYouTubeChannelFlow - The main function to trigger the sync process for one channel.
 * - SyncResult - The output type detailing how many videos were synced.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { fetchChannelVideosFlow } from './youtube-channel-videos-flow';
import { saveSyncedVideos } from '../../app/actions/save-synced-videos';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Channel } from '../../lib/types';
import { SyncResultSchema } from './sync-channels-flow';

if (getApps().length === 0) {
  initializeApp();
}
const firestore = getFirestore();

const SyncSingleChannelInputSchema = z.object({
  channelId: z.string().describe('The ID of the channel to sync.'),
});

export const syncSingleYouTubeChannelFlow = ai.defineFlow(
  {
    name: 'syncSingleYouTubeChannelFlow',
    inputSchema: SyncSingleChannelInputSchema,
    outputSchema: SyncResultSchema,
  },
  async ({ channelId }) => {
    let newVideosAdded = 0;

    // 1. Get the specific channel and its existing videos
    const channelRef = firestore.doc(`channels/${channelId}`);
    const channelDoc = await channelRef.get();

    if (!channelDoc.exists) {
      return { syncedChannels: 0, newVideosAdded: 0, errors: [`Channel with ID ${channelId} not found.`] };
    }
    const channel = { id: channelDoc.id, ...channelDoc.data() } as Channel;

    if (!channel.youtubeChannelUrl) {
      return { syncedChannels: 0, newVideosAdded: 0, errors: [`Channel "${channel.name}" does not have a YouTube URL configured.`] };
    }
    
    const videosSnapshot = await firestore.collection('videos').where('channelId', '==', channelId).get();
    const existingIdsSet = new Set(videosSnapshot.docs.map(doc => doc.data().youtubeVideoId));

    // 2. Fetch latest videos from the YouTube channel
    try {
      const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });
      
      // Filter out videos that already exist
      const newVideosToSave = fetchedVideos.filter(video => !existingIdsSet.has(video.videoId));

      if (newVideosToSave.length > 0) {
        const videosData = newVideosToSave.map(videoData => ({
          youtubeVideoId: videoData.videoId,
          title: videoData.title,
          description: videoData.description,
          thumbnailUrl: videoData.thumbnailUrl,
          channelId: channel.id,
          contentCategory: 'Uncategorized',
          views: Math.floor(Math.random() * 100),
          watchTime: Math.floor(Math.random() * 100),
        }));

        await saveSyncedVideos(videosData);
        newVideosAdded = videosData.length;
      }
      
      return { syncedChannels: 1, newVideosAdded, errors: [] };

    } catch (error: any) {
      console.error(`Failed to sync channel "${channel.name}":`, error);
      return { syncedChannels: 0, newVideosAdded: 0, errors: [`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`] };
    }
  }
);
