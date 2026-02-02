'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

export const SingleEmailInputSchema = z.object({
  to: z.string().email("Invalid email address.").describe("The recipient's email address."),
  subject: z.string().describe("The subject line of the email."),
  htmlBody: z.string().describe("The HTML content of the email body."),
});
export type SingleEmailInput = z.infer<typeof SingleEmailInputSchema>;

export const SingleEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SingleEmailOutput = z.infer<typeof SingleEmailOutputSchema>;


export const sendSingleEmailFlow = ai.defineFlow(
  {
    name: 'sendSingleEmailFlow',
    inputSchema: SingleEmailInputSchema,
    outputSchema: SingleEmailOutputSchema,
  },
  async ({ to, subject, htmlBody }) => {
    
    await initializeAdminApp();
    const firestore = getFirestore();

    try {
      const emailQueueCollection = firestore.collection('email_queue');
      
      const newEmailRef = emailQueueCollection.doc();
      await newEmailRef.set({
        id: newEmailRef.id,
        to: to,
        message: {
          subject: subject,
          html: htmlBody,
        },
        status: 'queued',
        createdAt: FieldValue.serverTimestamp(),
      });

      return { 
          success: true, 
          message: `Successfully queued email to ${to}.`,
      };

    } catch (error: any) {
      console.error('[Single Email Flow] Error queuing email:', error);
      const errorMessage = error.message || 'An unknown error occurred.';
      return { success: false, message: errorMessage };
    }
  }
);
