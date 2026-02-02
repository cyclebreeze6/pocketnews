'use server';
/**
 * @fileOverview A flow to send a push notification about a new video to relevant users.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import type { admin } from 'firebase-admin';

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
  async ({ videoId, category }: NotificationInput): Promise<NotificationOutput> => {
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

        // Find users who have subscribed to this category
        const usersSnapshot = await db.collection('users')
            .where('preferredCategories', 'array-contains', category)
            .get();

        if (usersSnapshot.empty) {
            return { success: true, message: 'No users subscribed to this category.' };
        }

        const userIds = usersSnapshot.docs.map(doc => doc.id);
        
        // Get FCM tokens for these users
        const tokenPromises = userIds.map(id => 
            db.collection('users').doc(id).collection('fcmTokens').get()
        );
        const tokenSnapshots = await Promise.all(tokenPromises);
        const tokens = tokenSnapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data().token));
        const uniqueTokens = [...new Set(tokens)];

        if (uniqueTokens.length === 0) {
            return { success: true, message: 'No registered devices for subscribed users.' };
        }
        
        // Send notification
        const message: admin.messaging.MulticastMessage = {
            notification: {
                title: `New Video in ${category}`,
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
);

export async function sendNewVideoNotification(input: NotificationInput): Promise<NotificationOutput> {
  return sendNewVideoNotificationFlow(input);
}
