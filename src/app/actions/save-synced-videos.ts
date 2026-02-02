'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { sendNewVideoNotification } from '../../ai/flows/send-notification-flow';
import 'dotenv/config';

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}


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
 * After saving, it can trigger notifications for each new video.
 * @param videos - An array of video data objects to save.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  if (!videos || videos.length === 0) {
    return;
  }

  const firestore = getFirestore(adminApp);
  const batch = firestore.batch();

  const savedVideoIdsAndCategories: { videoId: string; category: string }[] = [];

  videos.forEach(video => {
    const docRef = firestore.collection('videos').doc(); // Auto-generate ID
    const videoData = {
      ...video,
      id: docRef.id,
      createdAt: new Date(), // Use current server date
      uploadDate: new Date(),
    };
    batch.set(docRef, videoData);

    // Keep track of saved videos for notification step
    savedVideoIdsAndCategories.push({ videoId: docRef.id, category: video.contentCategory });
  });

  // Commit the batch to save all videos
  await batch.commit();

  // After saving, trigger notifications for each new video
  // We do this after the commit to ensure the video exists when the notification is clicked.
  for (const { videoId, category } of savedVideoIdsAndCategories) {
    // This is a "fire-and-forget" call. We don't need to wait for it.
    sendNewVideoNotification({ videoId, category })
      .catch(err => console.error(`Failed to send notification for video ${videoId}:`, err));
  }
}
