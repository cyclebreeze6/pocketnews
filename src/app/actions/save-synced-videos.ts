'use server';

import { initializeFirebase } from '../../firebase/index';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';
import { sendNewVideoNotification } from '../../ai/flows/send-notification-flow';

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
  const newVideoNotifications: { videoId: string, category: string }[] = [];

  videos.forEach(video => {
    const docRef = doc(collection(firestore, 'videos')); // Auto-generate ID
    const videoData = {
      ...video,
      id: docRef.id,
      createdAt: serverTimestamp(),
      uploadDate: serverTimestamp(),
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
