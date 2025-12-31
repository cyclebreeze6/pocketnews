'use server';
import { sendManualNotificationFlow } from '../../ai/flows/send-manual-notification-flow';
import type { ManualNotificationInput, ManualNotificationOutput } from '../../ai/flows/send-manual-notification-flow';

export async function sendManualNotification(input: ManualNotificationInput): Promise<ManualNotificationOutput> {
  return sendManualNotificationFlow(input);
}
