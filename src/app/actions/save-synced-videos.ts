'use server';

import 'dotenv/config';
// NOTE: firebase-admin and the notification flow have been removed to ensure server stability.

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
 * This server action is temporarily disabled.
 * @param videos - An array of video data objects to save.
 */
export async function saveSyncedVideos(videos: NewVideoData[]): Promise<void> {
  console.warn('[saveSyncedVideos] Temporarily disabled due to server instability. Skipping video save.');
  if (!videos || videos.length === 0) {
    return;
  }
  // Do nothing.
  return;
}
