'use server';
import { sendBroadcastEmailFlow } from '../../ai/flows/send-broadcast-email-flow';
import type { BroadcastEmailInput, BroadcastEmailOutput } from '../../ai/flows/send-broadcast-email-flow';

export async function sendBroadcastEmail(input: BroadcastEmailInput): Promise<BroadcastEmailOutput> {
  return sendBroadcastEmailFlow(input);
}
