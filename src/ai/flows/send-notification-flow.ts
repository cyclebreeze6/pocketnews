'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import 'dotenv/config';
import type { Video } from '../../lib/types';


async function initializeAdminApp() {
    if (getApps().length > 0) {
        return;
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        initializeApp({
            credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
        });
    } else {
        // This is for environments like Google Cloud Run where ADC are available.
        initializeApp();
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

      // 2. Get all users and their FCM tokens
      const usersSnapshot = await firestore.collection('users').get();
      const userTokens: { userId: string; token: string; email: string | undefined }[] = [];

      for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();
          const tokensSnapshot = await firestore.collection('users').doc(userId).collection('fcmTokens').get();
          tokensSnapshot.forEach(tokenDoc => {
              userTokens.push({ userId, token: tokenDoc.data().token, email: userData.email });
          });
      }

      if (userTokens.length === 0) {
        return { success: true, message: 'No users subscribed for notifications.' };
      }
      
      const uniqueTokens = Array.from(new Set(userTokens.map(ut => ut.token)));
      const videoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/watch/${videoId}`;

      // 3. Send Push Notifications
      if (uniqueTokens.length > 0) {
          const message = {
            notification: {
              title: 'New Video: ' + video.title,
              body: video.description,
            },
            webpush: {
              fcmOptions: {
                link: videoUrl,
              },
              notification: {
                icon: video.thumbnailUrl,
              }
            },
            tokens: uniqueTokens,
          };
          const batchResponse = await messaging.sendEachForMulticast(message);
          console.log(`Successfully sent ${batchResponse.successCount} push notifications.`);
      }

      // 4. Queue Emails
      const emailQueueRef = firestore.collection('email_queue');
      const uniqueEmails = Array.from(new Set(userTokens.map(ut => ut.email).filter(Boolean)));
      
      for (const email of uniqueEmails) {
          await emailQueueRef.add({
              to: email,
              message: {
                  subject: `New Breaking News: ${video.title}`,
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


      return { success: true, message: `Notifications processed.` };

    } catch (error: any) {
      console.error('Error sending notification:', error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
  }
);
