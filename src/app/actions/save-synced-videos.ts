'use server';

import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { sendNewVideoNotification } from '../../ai/flows/send-notification-flow';
import { FieldValue } from 'firebase-admin/firestore';

type NewVideoData = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  contentCategory: string;
  views: number;
  watchTime: number;
  regions: string[];
};

/**
 * Saves an array of new video data to Firestore using a batch write.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  if (!videos || videos.length === 0) {
    return;
  }

  if (!isFirebaseAdminInitialized) {
    console.error("Firebase Admin SDK is not initialized.");
    throw new Error("Cannot save videos: Admin SDK not configured.");
  }

  const firestore = adminSDK.firestore();
  const batch = firestore.batch();
  const newVideoNotifications: { videoId: string, channelId: string }[] = [];
  const videosCollection = firestore.collection('videos');

  videos.forEach(video => {
    const docRef = videosCollection.doc();
    const videoData = {
      ...video,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp(),
      uploadDate: FieldValue.serverTimestamp(),
    };
    batch.set(docRef, videoData);
    newVideoNotifications.push({ videoId: docRef.id, channelId: video.channelId });
  });

  await batch.commit();

  // Optimized notification firing: 
  // Limit to most recent 5 videos per sync run to avoid server/FCM overhead
  const topNotifications = newVideoNotifications.slice(0, 5);
  for (const { videoId, channelId } of topNotifications) {
    sendNewVideoNotification({ videoId, channelId })
      .catch(err => console.error(`Failed to send notification for video ${videoId}:`, err));
  }
}
