'use server';
/**
 * NOTE: This feature is temporarily disabled to allow application deployment.
 */
import { ai } from '../genkit';
import { z } from 'zod';

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
    console.warn("sendManualNotificationFlow is disabled.");
    return {
      success: false,
      message: "Push notifications are temporarily disabled due to server environment configuration.",
    };
  }
);
