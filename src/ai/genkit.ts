import { genkit, Ai } from 'genkit';

let aiInstance: Ai | null = null;
if (!aiInstance) {
  aiInstance = genkit({
    plugins: [
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: false,
  });
}
export const ai = aiInstance;
