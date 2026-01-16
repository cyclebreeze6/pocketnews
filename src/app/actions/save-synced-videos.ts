
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import 'dotenv/config';
import { sendNewVideoNotification } from '../../ai/flows/send-notification-flow';

// A leaner version of the Video type for this specific action
type NewVideoData = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  contentCategory: string;
  language?: string;
  region?: string;
  views: number;
  watchTime: number;
};

type NotificationInput = {
    videoId: string;
    category: string;
}


/**
 * Saves an array of new video data to Firestore using a batch write.
 * This is a server action.
 * @param videos - An array of video data objects to save.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON. Falling back to default credentials.", e);
            initializeApp();
        }
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

  const videosToNotify: { id: string; category: string }[] = [];

  videos.forEach(videoData => {
    const newDocRef = videosCollectionRef.doc(); // Auto-generate a new ID
    const videoDoc = {
      id: newDocRef.id,
      ...videoData,
      language: videoData.language || 'English',
      region: videoData.region || 'Americas',
      createdAt: FieldValue.serverTimestamp(),
      uploadDate: new Date().toISOString(), // Set upload date to now
    };
    batch.set(newDocRef, videoDoc);
    videosToNotify.push({ id: newDocRef.id, category: videoData.contentCategory });
  });

  try {
    await batch.commit();
    // After successfully saving, trigger notifications
    for (const video of videosToNotify) {
        // Do not await this, let it run in the background
        if (video.category) {
          sendNewVideoNotification({ videoId: video.id, category: video.category } as NotificationInput).catch(err => {
            console.error(`Error triggering notification for video ${video.id}:`, err);
          });
        }
    }
  } catch (error) {
    console.error("Error committing video batch:", error);
    // Re-throw the error so the calling flow can handle it.
    throw new Error('Failed to save new videos to the database.');
  }
}
