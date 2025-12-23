
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import 'dotenv/config';
import type { Video } from '../../lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Helper to initialize the admin app idempotently
async function initializeAdminApp() {
    if (getApps().length > 0) {
        return;
    }
    // Check if the service account key is available and is a valid JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON. Falling back to default credentials.", e);
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

    const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONE_SIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      const errorMsg = 'OneSignal App ID or REST API Key is not configured in environment variables.';
      console.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    try {
      // 1. Get the new video's details
      const videoRef = firestore.collection('videos').doc(videoId);
      const videoSnap = await videoRef.get();
      if (!videoSnap.exists) {
        throw new Error(`Video with ID ${videoId} not found`);
      }
      const video = videoSnap.data() as Video;
      const videoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/watch/${videoId}`;
      
      // 2. Define the filter for targeting users based on category
      const categoryTag = `category_${category.toLowerCase()}`;
      
      // 3. Send Push Notification via OneSignal
      const notification = {
        app_id: ONE_SIGNAL_APP_ID,
        // Correctly formatted filters array for the OneSignal API
        filters: [
            { "field": "tag", "key": categoryTag, "relation": "=", "value": "true" }
        ],
        headings: { en: 'New Video: ' + video.title },
        contents: { en: video.description },
        web_url: videoUrl,
        chrome_web_image: video.thumbnailUrl, // For Chrome on desktop
        firefox_icon: video.thumbnailUrl, // For Firefox
      };

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(notification),
      });
      
      const responseData = await response.json();

      if (response.status >= 400) {
        console.error('OneSignal API Error Response:', responseData);
        throw new Error(`OneSignal API Error: ${JSON.stringify(responseData.errors || 'Unknown error')}`);
      }

      if (responseData.errors && responseData.errors.length > 0) {
          console.error('OneSignal Notification Error:', responseData.errors);
          throw new Error(`OneSignal API Error: ${JSON.stringify(responseData.errors)}`);
      }
      console.log(`Successfully sent push notification via OneSignal. ID: ${responseData.id}`);

      // 4. Queue Emails
      // This part remains unchanged
      const emailQueueRef = firestore.collection('email_queue');
      const usersSnapshot = await firestore.collection('users').get();
      const uniqueEmails: string[] = [];

      usersSnapshot.forEach(doc => {
          const userData = doc.data();
          // Filter out anonymous user emails and ensure the user exists
          if (userData && userData.email && !userData.isAnonymous) {
              uniqueEmails.push(userData.email);
          }
      });
      
      for (const email of uniqueEmails) {
          await emailQueueRef.add({
              to: email,
              message: {
                  subject: `New Video in ${category}: ${video.title}`,
                  html: `
                    <h1>${video.title}</h1>
                    <p>${video.description}</p>
                    <a href="${videoUrl}">
                        <img src="${video.thumbnailUrl}" alt="${video.title}" width="480" />
                    </a>
                    <p><a href="${videoUrl}">Watch Now</a></p>
                  `,
              }
          });
      }
      console.log(`Successfully queued ${uniqueEmails.length} emails.`);

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
