/**
 * @fileOverview A flow to send a manual push notification to all users with a valid FCM token.
 */
import { ai } from '../genkit';
import { z } from 'zod';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import type { admin } from 'firebase-admin';

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
  async (input: ManualNotificationInput): Promise<ManualNotificationOutput> => {
    if (!isFirebaseAdminInitialized) {
      return {
        success: false,
        message: "Push notifications are disabled because the Firebase Admin SDK is not configured on the server.",
      };
    }
    
    try {
      const db = adminSDK.firestore();
      const usersSnapshot = await db.collection('users').get();
      const tokenPromises = usersSnapshot.docs.map(userDoc => 
        db.collection('users').doc(userDoc.id).collection('fcmTokens').get()
      );
      
      const tokenSnapshots = await Promise.all(tokenPromises);
      const allTokens = tokenSnapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data().token));
      
      const uniqueTokens = [...new Set(allTokens)];

      if (uniqueTokens.length === 0) {
        return { success: true, message: "No registered devices to send notifications to.", successCount: 0, failureCount: 0 };
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: input.title,
          body: input.body,
          ...(input.imageUrl && { imageUrl: input.imageUrl }),
        },
        webpush: {
          fcmOptions: {
            link: input.link || 'https://pocketnewslive.tv/',
          },
        },
        tokens: uniqueTokens,
      };

      const response = await adminSDK.messaging().sendEachForMulticast(message);
      
      return {
        success: true,
        message: `Notifications sent with ${response.successCount} successes and ${response.failureCount} failures.`,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };

    } catch (error: any) {
        console.error("Error sending manual notification:", error);
        return {
            success: false,
            message: `An error occurred: ${error.message}`
        }
    }
  }
);
