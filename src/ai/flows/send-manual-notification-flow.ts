'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import 'dotenv/config';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Helper to initialize the admin app idempotently
async function initializeAdminApp() {
    if (getApps().length > 0) {
        return;
    }
    
    // Check if the service account key is available in env and is a valid JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log("[Notification Flow] Initialized Firebase Admin SDK with service account from env.");
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY env var is set but not valid JSON. Falling back to default credentials.", e);
            initializeApp();
        }
    } else {
        // Fallback to Application Default Credentials
        console.log("[Notification Flow] Initializing Firebase Admin SDK with Application Default Credentials.");
        initializeApp();
    }
}

export const ManualNotificationInputSchema = z.object({
  title: z.string().describe("The title of the push notification."),
  body: z.string().describe("The main message content of the notification."),
  link: z.string().url().optional().describe("An optional URL to open when the notification is clicked."),
  imageUrl: z.string().url().optional().describe("An optional URL for an image to display in the notification.")
});
export type ManualNotificationInput = z.infer<typeof ManualNotificationInputSchema>;

export const ManualNotificationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  successCount: z.number().optional(),
  failureCount: z.number().optional(),
});
export type ManualNotificationOutput = z.infer<typeof ManualNotificationOutputSchema>;


export const sendManualNotificationFlow = ai.defineFlow(
  {
    name: 'sendManualNotificationFlow',
    inputSchema: ManualNotificationInputSchema,
    outputSchema: ManualNotificationOutputSchema,
  },
  async ({ title, body, link, imageUrl }) => {
    
    console.log(`[Manual Notification Flow] Starting...`);

    await initializeAdminApp();
    const firestore = getFirestore();
    const messaging = getMessaging();

    try {
      // Get all FCM tokens from all users
      const tokens: string[] = [];
      const usersSnapshot = await firestore.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const tokensSnapshot = await userDoc.ref.collection('fcmTokens').get();
        tokensSnapshot.forEach(tokenDoc => tokens.push(tokenDoc.id));
      }
      
      if (tokens.length === 0) {
        return { success: true, message: "No users have enabled notifications." };
      }

      console.log(`[Manual Notification Flow] Found ${tokens.length} total tokens. Sending message...`);
      
      const message = {
        notification: {
            title: title,
            body: body,
            ...(imageUrl && { imageUrl: imageUrl })
        },
        webpush: {
            fcm_options: {
                ...(link && { link: link })
            },
            notification: {
                ...(imageUrl && { icon: imageUrl })
            }
        },
        tokens: tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      
      console.log(`[Manual Notification Flow] Successfully sent ${response.successCount} push notifications.`);
      if (response.failureCount > 0) {
          console.warn(`[Manual Notification Flow] Failed to send ${response.failureCount} push notifications.`);
      }

      return { 
          success: true, 
          message: `Sent ${response.successCount} notifications.`,
          successCount: response.successCount,
          failureCount: response.failureCount
      };

    } catch (error: any) {
      console.error('[Manual Notification Flow] Error sending notification:', error);
      // Firebase Admin SDK often gives useful error messages.
      const errorMessage = error.message || 'An unknown error occurred.';
      return { success: false, message: errorMessage };
    }
  }
);
