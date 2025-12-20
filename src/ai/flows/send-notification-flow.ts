'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import 'dotenv/config';
import type { Video } from '../../lib/types';


async function initializeAdminApp() {
    if (getApps().length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            initializeApp({
                credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
            });
        } else {
            initializeApp();
        }
    }
}

export const sendNewVideoNotificationFlow = ai.defineFlow(
  {
    name: 'sendNewVideoNotificationFlow',
    inputSchema: z.string(), // videoId
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (videoId) => {
    await initializeAdminApp();
    const firestore = getFirestore();
    const messaging = getMessaging();

    try {
      // 1. Get the new video's details
      const videoRef = firestore.doc(`videos/${videoId}`);
      const videoSnap = await videoRef.get();
      if (!videoSnap.exists()) {
        throw new Error('Video not found');
      }
      const video = videoSnap.data() as Video;

      // 2. Get all user FCM tokens
      const fcmTokensSnapshot = await firestore.collectionGroup('fcmTokens').get();
      const tokens = fcmTokensSnapshot.docs.map(doc => doc.data().token);

      if (tokens.length === 0) {
        return { success: true, message: 'No users subscribed for notifications.' };
      }
      
      const uniqueTokens = [...new Set(tokens)];

      // 3. Construct the notification message
      const message = {
        notification: {
          title: 'New Video Uploaded!',
          body: video.title,
        },
        webpush: {
          fcmOptions: {
            link: `${process.env.NEXT_PUBLIC_BASE_URL}/watch/${videoId}`,
          },
           notification: {
             icon: video.thumbnailUrl,
           }
        },
        tokens: uniqueTokens,
      };

      // 4. Send the multicast message
      const batchResponse = await messaging.sendEachForMulticast(message);
      
      const successCount = batchResponse.successCount;
      const failureCount = batchResponse.failureCount;

      console.log(`Successfully sent ${successCount} messages. Failed to send ${failureCount} messages.`);

      if (failureCount > 0) {
          batchResponse.responses.forEach((resp, idx) => {
              if (!resp.success) {
                  console.error(`Failed to send to token ${uniqueTokens[idx]}:`, resp.error);
                  // Optional: Add logic to remove invalid tokens from Firestore
              }
          });
      }

      return { success: true, message: `Notifications sent to ${successCount} devices.` };

    } catch (error: any) {
      console.error('Error sending notification:', error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
  }
);
