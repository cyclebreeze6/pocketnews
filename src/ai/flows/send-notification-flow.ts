/**
 * @fileOverview A function to send a push notification about a new video to users following the channel.
 */
import { z } from 'zod';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import type { admin } from 'firebase-admin';

const NotificationInputSchema = z.object({
  videoId: z.string(),
  channelId: z.string(),
});
type NotificationInput = z.infer<typeof NotificationInputSchema>;

const NotificationOutputSchema = z.object({ success: z.boolean(), message: z.string() });
type NotificationOutput = z.infer<typeof NotificationOutputSchema>;

/**
 * Standard async function to avoid Genkit metadata authentication errors.
 */
export async function sendNewVideoNotificationFlow({ videoId, channelId }: NotificationInput): Promise<NotificationOutput> {
  if (!isFirebaseAdminInitialized) {
      return { success: false, message: 'Notifications are disabled on the server.' };
  }
  
  try {
      const db = adminSDK.firestore();
      
      // Fetch the video details
      const videoDoc = await db.collection('videos').doc(videoId).get();
      if (!videoDoc.exists) {
          return { success: false, message: 'Video not found.' };
      }
      const video = videoDoc.data();

      // Find users who are following this channel
      const followersSnapshot = await db.collectionGroup('followedChannels')
          .where('channelId', '==', channelId)
          .get();

      if (followersSnapshot.empty) {
          return { success: true, message: 'No users are following this channel.' };
      }

      const userIds = followersSnapshot.docs.map(doc => doc.ref.parent.parent!.id);
      
      // Get FCM tokens for these users
      const tokenPromises = userIds.map(id => 
          db.collection('users').doc(id).collection('fcmTokens').get()
      );
      const tokenSnapshots = await Promise.all(tokenPromises);
      const tokens = tokenSnapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data().token));
      const uniqueTokens = [...new Set(tokens)];

      if (uniqueTokens.length === 0) {
          return { success: true, message: 'No registered devices for followed users.' };
      }
      
      const channelDoc = await db.collection('channels').doc(channelId).get();
      const channelName = channelDoc.data()?.name || 'a channel you follow';
      
      // Send notification
      const message: admin.messaging.MulticastMessage = {
          notification: {
              title: `New video from ${channelName}`,
              body: video?.title || 'A new video has been added!',
              ...(video?.thumbnailUrl && { imageUrl: video.thumbnailUrl }),
          },
          webpush: {
              fcmOptions: {
                  link: `https://pocketnewslive.tv/watch/${videoId}`,
              },
          },
          tokens: uniqueTokens,
      };

      const response = await adminSDK.messaging().sendEachForMulticast(message);
      console.log(`Notification sent for video ${videoId}: ${response.successCount} successes.`);
      
      return { success: true, message: `Sent to ${response.successCount} devices.` };

  } catch (error: any) {
      console.error(`Error sending notification for video ${videoId}:`, error);
      return { success: false, message: `An error occurred: ${error.message}` };
  }
}

export async function sendNewVideoNotification(input: NotificationInput): Promise<NotificationOutput> {
  return sendNewVideoNotificationFlow(input);
}
