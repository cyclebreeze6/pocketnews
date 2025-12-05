'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import 'dotenv/config';

// Initialize firebase-admin
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } else {
    initializeApp();
  }
}

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
  if (!videos || videos.length === 0) {
    return;
  }

  const firestore = getFirestore();
  const batch = firestore.batch();
  const videosCollectionRef = firestore.collection('videos');

  videos.forEach(videoData => {
    const newDocRef = videosCollectionRef.doc(); // Auto-generate a new ID
    const videoDoc = {
      id: newDocRef.id,
      ...videoData,
      createdAt: FieldValue.serverTimestamp(),
      uploadDate: new Date().toISOString(), // Set upload date to now
    };
    batch.set(newDocRef, videoDoc);
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error committing video batch:", error);
    // Re-throw the error so the calling flow can handle it.
    throw new Error('Failed to save new videos to the database.');
  }
}
