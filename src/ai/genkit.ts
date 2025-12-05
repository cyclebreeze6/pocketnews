import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { googleAuth } from 'genkit/plugins/google-auth';

const googleGenAIVision = googleAI.model('gemini-1.5-flash-latest');
const googleGenAILanguage = googleAI.model('gemini-1.5-flash-latest');

let aiInstance: Ai | null = null;
if (!aiInstance) {
  aiInstance = genkit({
    plugins: [
      googleAuth(), // Add the Google Auth plugin
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
