
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
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
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

    try {
      // 1. Get the new video's details
      const videoRef = firestore.collection('videos').doc(videoId);
      const videoSnap = await videoRef.get();
      if (!videoSnap.exists) {
        throw new Error(`Video with ID ${videoId} not found`);
      }
      const video = videoSnap.data() as Video;
      const videoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/watch/${videoId}`;
      
      // 2. Queue Emails
      const emailQueueRef = firestore.collection('email_queue');
      // For now, let's only get users who have a preference for this category.
      const usersSnapshot = await firestore.collection('users').where('preferredCategories', 'array-contains', category).get();

      const uniqueEmails: string[] = [];
      usersSnapshot.forEach(doc => {
          const userData = doc.data();
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
      console.log(`Successfully queued ${uniqueEmails.length} emails for category ${category}.`);

      return { success: true, message: `Email notifications processed for category ${category}.` };

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
