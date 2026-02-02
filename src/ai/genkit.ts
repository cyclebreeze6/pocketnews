import { genkit, Ai } from 'genkit';
// AI functionality is temporarily disabled to resolve a server startup issue.
// import { googleAI } from '@genkit-ai/google-genai';

let aiInstance: Ai | null = null;
if (!aiInstance) {
  aiInstance = genkit({
    plugins: [
      // googleAI(),
    ],
  });
}
export const ai = aiInstance;
