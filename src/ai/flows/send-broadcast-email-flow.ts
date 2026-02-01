'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore, writeBatch } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Helper to initialize the admin app idempotently
async function initializeAdminApp() {
    if (getApps().length > 0) {
        return;
    }
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY env var is set but not valid JSON. Falling back to default credentials.", e);
            initializeApp();
        }
    } else {
        initializeApp();
    }
}

export const BroadcastEmailInputSchema = z.object({
  subject: z.string().describe("The subject line of the email."),
  htmlBody: z.string().describe("The HTML content of the email body."),
});
export type BroadcastEmailInput = z.infer<typeof BroadcastEmailInputSchema>;

export const BroadcastEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  emailsQueued: z.number().optional(),
});
export type BroadcastEmailOutput = z.infer<typeof BroadcastEmailOutputSchema>;


export const sendBroadcastEmailFlow = ai.defineFlow(
  {
    name: 'sendBroadcastEmailFlow',
    inputSchema: BroadcastEmailInputSchema,
    outputSchema: BroadcastEmailOutputSchema,
  },
  async ({ subject, htmlBody }) => {
    
    await initializeAdminApp();
    const firestore = getFirestore();

    try {
      // 1. Get all users
      const usersSnapshot = await firestore.collection('users').get();
      
      if (usersSnapshot.empty) {
        return { success: true, message: "No users found in the database to send emails to." };
      }

      // 2. Prepare batch writes to the email_queue
      let batch = writeBatch(firestore);
      const emailQueueRef = firestore.collection('email_queue');
      let writesInBatch = 0;
      let totalQueued = 0;

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (user.email) {
          const newEmailRef = emailQueueRef.doc();
          batch.set(newEmailRef, {
            to: user.email,
            message: {
              subject: subject,
              html: htmlBody,
            },
          });
          writesInBatch++;
          totalQueued++;

          // Firestore batches have a limit of 500 operations.
          if (writesInBatch >= 499) {
            await batch.commit();
            batch = writeBatch(firestore);
            writesInBatch = 0;
          }
        }
      }

      // Commit any remaining writes in the last batch.
      if (writesInBatch > 0) {
        await batch.commit();
      }

      return { 
          success: true, 
          message: `Successfully queued ${totalQueued} emails.`,
          emailsQueued: totalQueued,
      };

    } catch (error: any) {
      console.error('[Broadcast Email Flow] Error queuing emails:', error);
      const errorMessage = error.message || 'An unknown error occurred.';
      return { success: false, message: errorMessage };
    }
  }
);
