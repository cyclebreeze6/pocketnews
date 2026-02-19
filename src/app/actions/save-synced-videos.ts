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
 * Saves an array of new video data to Firestore using a batch write with the Admin SDK.
 * @param videos - An array of video data objects to save.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  if (!videos || videos.length === 0) {
    return;
  }

  if (!isFirebaseAdminInitialized) {
    console.error("Firebase Admin SDK is not initialized. Cannot save videos from server-side flow.");
    throw new Error("Cannot save videos: Admin SDK not configured.");
  }

  const firestore = adminSDK.firestore();
  const batch = firestore.batch();
  const newVideoNotifications: { videoId: string, category: string }[] = [];
  const videosCollection = firestore.collection('videos');

  videos.forEach(video => {
    const docRef = videosCollection.doc(); // Auto-generate ID with admin SDK
    const videoData = {
      ...video,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp(),
      uploadDate: FieldValue.serverTimestamp(),
    };
    batch.set(docRef, videoData);
    newVideoNotifications.push({ videoId: docRef.id, category: video.contentCategory });
  });

  await batch.commit();

  // After saving, trigger notifications for each new video.
  // This runs in the background and does not block the main function's response.
  for (const { videoId, category } of newVideoNotifications) {
    sendNewVideoNotification({ videoId, category })
      .catch(err => console.error(`Failed to send notification for video ${videoId}:`, err));
  }
}
