'use server';

import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const googleGenAIVision = googleAI.model('gemini-1.5-flash-latest');
const googleGenAILanguage = googleAI.model('gemini-1.5-flash-latest');

let aiInstance: Ai | null = null;
if (!aiInstance) {
  aiInstance = genkit({
    plugins: [
      googleAI({
        apiVersion: 'v1beta',
      }),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });
}
export const ai = aiInstance;

export { googleGenAIVision, googleGenAILanguage };
