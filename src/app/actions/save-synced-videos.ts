'use server';

import { initializeFirebase } from '../../firebase/index';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';

/**
 * NOTE: The notification part of this function is disabled as it requires
 * the `firebase-admin` package, which has been temporarily removed for stability.
 */
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
 * @param videos - An array of video data objects to save.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  if (!videos || videos.length === 0) {
    return;
  }

  const { firestore } = initializeFirebase();
  const batch = writeBatch(firestore);

  videos.forEach(video => {
    const docRef = doc(collection(firestore, 'videos')); // Auto-generate ID
    const videoData = {
      ...video,
      id: docRef.id,
      createdAt: serverTimestamp(),
      uploadDate: serverTimestamp(),
    };
    batch.set(docRef, videoData);
  });

  await batch.commit();

  // Notification logic is disabled.
}
