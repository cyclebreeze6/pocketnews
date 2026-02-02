'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import 'dotenv/config';

// Firebase Admin SDK has been removed to ensure server stability.
// The notification feature is temporarily disabled.

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
    console.warn('[Manual Notification Flow] Temporarily disabled due to server instability.');
    return {
      success: false,
      message: "This feature is temporarily disabled to ensure application stability.",
      successCount: 0,
      failureCount: 0,
    };
  }
);
