'use server';

import { sendNewVideoNotificationFlow } from '../../ai/flows/send-notification-flow';

/**
 * Server Action wrapper for the sendNewVideoNotification flow.
 * Ensures the flow can be safely called from client components.
 */
export async function sendNewVideoNotification(input: { videoId: string; channelId: string }) {
  try {
    return await sendNewVideoNotificationFlow(input);
  } catch (error: any) {
    console.error('Failed to trigger notification via server action:', error);
    return { success: false, message: error.message };
  }
}
