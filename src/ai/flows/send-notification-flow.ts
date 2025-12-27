
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import 'dotenv/config';
import type { Video } from '../../lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Helper to initialize the admin app idempotently
async function initializeAdminApp() {
    if (getApps().length > 0) {
        return;
    }
    // Check if the service account key is available and is a valid JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
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
        // Fallback to Application Default Credentials
        initializeApp();
    }
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
    
    await initializeAdminApp();
    const firestore = getFirestore();
    const messaging = getMessaging();

    try {
      // 1. Get the new video's details
      const videoRef = firestore.collection('videos').doc(videoId);
      const videoSnap = await videoRef.get();
      if (!videoSnap.exists) {
        throw new Error(`Video with ID ${videoId} not found`);
      }
      const video = videoSnap.data() as Video;
      const videoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/watch/${videoId}`;
      
      // 2. Find users interested in this category
      const usersSnapshot = await firestore.collection('users').where('preferredCategories', 'array-contains', category).get();

      if (usersSnapshot.empty) {
        return { success: true, message: `No users subscribed to category ${category}.` };
      }

      const userIds = usersSnapshot.docs.map(doc => doc.id);
      
      // 3. Get FCM tokens for these users
      const tokens: string[] = [];
      for (const userId of userIds) {
        const tokensSnapshot = await firestore.collection('users').doc(userId).collection('fcmTokens').get();
        tokensSnapshot.forEach(doc => tokens.push(doc.id));
      }
      
      // 4. Send Push Notifications if tokens are available
      if (tokens.length > 0) {
        const message = {
            notification: {
                title: `New Video in ${category}`,
                body: video.title,
            },
            webpush: {
                fcm_options: {
                    link: videoUrl,
                },
                 notification: {
                    icon: video.thumbnailUrl,
                 }
            },
            tokens: tokens,
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} push notifications.`);
        if (response.failureCount > 0) {
            console.warn(`Failed to send ${response.failureCount} push notifications.`);
        }
      }

      return { success: true, message: `Notifications processed for category ${category}.` };

    } catch (error: any) {
      console.error('Error sending notification:', error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
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
