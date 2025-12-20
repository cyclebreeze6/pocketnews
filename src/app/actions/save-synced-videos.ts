'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import 'dotenv/config';
import { sendNewVideoNotificationFlow } from '../../ai/flows/send-notification-flow';

// A leaner version of the Video type for this specific action
type NewVideoData = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  contentCategory: string;
  views: number;
  watchTime: number;
};

/**
 * Saves an array of new video data to Firestore using a batch write.
 * This is a server action.
 * @param videos - An array of video data objects to save.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      });
    } else {
      // Fallback for environments where the service account key isn't set,
      // relying on application default credentials.
      initializeApp();
    }
  }

  if (!videos || videos.length === 0) {
    return;
  }

  const firestore = getFirestore();
  const batch = firestore.batch();
  const videosCollectionRef = firestore.collection('videos');

  const savedVideoIds: string[] = [];

  videos.forEach(videoData => {
    const newDocRef = videosCollectionRef.doc(); // Auto-generate a new ID
    const videoDoc = {
      id: newDocRef.id,
      ...videoData,
      createdAt: FieldValue.serverTimestamp(),
      uploadDate: new Date().toISOString(), // Set upload date to now
    };
    batch.set(newDocRef, videoDoc);
    savedVideoIds.push(newDocRef.id);
  });

  try {
    await batch.commit();
    // After successfully saving, trigger notifications for each new video
    for (const videoId of savedVideoIds) {
      await sendNewVideoNotificationFlow(videoId);
    }
  } catch (error) {
    console.error("Error committing video batch:", error);
    // Re-throw the error so the calling flow can handle it.
    throw new Error('Failed to save new videos to the database.');
  }
}
