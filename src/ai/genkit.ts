import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

let aiInstance: Ai | null = null;
if (!aiInstance) {
  aiInstance = genkit({
    plugins: [
      googleAI(),
    ],
  });
}
export const ai = aiInstance;
