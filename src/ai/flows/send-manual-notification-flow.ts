'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import 'dotenv/config';

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
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
    try {
      const firestore = getFirestore(adminApp);
      const messaging = getMessaging(adminApp);

      // Fetch all fcmTokens from all users
      const tokensSnapshot = await firestore.collectionGroup('fcmTokens').get();
      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

      if (tokens.length === 0) {
        return { success: true, message: 'No devices are registered to receive notifications.', successCount: 0, failureCount: 0 };
      }

      const message: any = {
        notification: {
          title,
          body,
        },
        webpush: {
          notification: {
            icon: '/POCKETNEWSLOGOdark.png'
          },
          fcm_options: {}
        },
        tokens: tokens,
      };

      if (link) {
          message.webpush.fcm_options.link = link;
      }
       if (imageUrl) {
          message.notification.image = imageUrl;
          message.webpush.notification.image = imageUrl;
      }

      const response = await messaging.sendEachForMulticast(message);

      return {
        success: true,
        message: `Successfully sent notifications to ${response.successCount} devices.`,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };

    } catch (error: any) {
      console.error('Error sending manual notification:', error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
