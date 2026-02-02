'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import 'dotenv/config';
import type { Video } from '../../lib/types';


let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

const NotificationInputSchema = z.object({
  videoId: z.string(),
  category: z.string(),
});
type NotificationInput = z.infer<typeof NotificationInputSchema>;

const NotificationOutputSchema = z.object({ success: z.boolean(), message: z.string() });
type NotificationOutput = z.infer<typeof NotificationOutputSchema>;


const sendNewVideoNotificationFlow = ai.defineFlow(
  {
    name: 'sendNewVideoNotificationFlow',
    inputSchema: NotificationInputSchema,
    outputSchema: NotificationOutputSchema,
  },
  async ({ videoId, category }) => {
    const firestore = getFirestore(adminApp);
    const messaging = getMessaging(adminApp);

    try {
      // 1. Fetch the video details to get the title
      const videoDoc = await firestore.collection('videos').doc(videoId).get();
      if (!videoDoc.exists) {
        return { success: false, message: `Video with ID ${videoId} not found.` };
      }
      const video = videoDoc.data() as Video;

      // 2. Find users who have subscribed to this category
      const usersSnapshot = await firestore.collection('users').where('preferredCategories', 'array-contains', category).get();
      if (usersSnapshot.empty) {
        return { success: true, message: 'No users subscribed to this category.' };
      }
      const userIds = usersSnapshot.docs.map(doc => doc.id);

      // 3. Gather FCM tokens for these users
      const tokenPromises = userIds.map(userId => firestore.collection('users').doc(userId).collection('fcmTokens').get());
      const tokenSnapshots = await Promise.all(tokenPromises);
      const allTokens = tokenSnapshots.flatMap(snap => snap.docs.map(doc => doc.data().token));

      if (allTokens.length === 0) {
        return { success: true, message: 'Subscribed users have no registered devices.' };
      }

      // 4. Send the notification
      const message = {
        notification: {
          title: `New in ${category}: ${video.title}`,
          body: 'Watch the latest video now!',
          image: video.thumbnailUrl,
        },
        webpush: {
            fcm_options: {
                link: `/watch/${videoId}`
            },
            notification: {
                icon: '/POCKETNEWSLOGOdark.png',
                image: video.thumbnailUrl,
            }
        },
        tokens: allTokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages`);

      return { success: true, message: `Notification sent to ${response.successCount} devices.` };

    } catch (error: any) {
      console.error('Error sending notification:', error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);


/**
 * Server Action to trigger the new video notification flow.
 * This is the function that should be imported and called from your client-side components.
 * @param input - The videoId and category for the notification.
 * @returns The result of the notification flow.
 */
export async function sendNewVideoNotification(input: NotificationInput): Promise<NotificationOutput> {
  return sendNewVideoNotificationFlow(input);
}
