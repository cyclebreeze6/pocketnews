'use server';
import { sendSingleEmailFlow } from '../../ai/flows/send-broadcast-email-flow';
import type { SingleEmailInput, SingleEmailOutput } from '../../ai/flows/send-broadcast-email-flow';

export async function sendSingleEmail(input: SingleEmailInput): Promise<SingleEmailOutput> {
  return sendSingleEmailFlow(input);
}
