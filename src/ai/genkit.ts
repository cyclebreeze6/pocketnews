/**
 * @fileOverview Centralized Genkit configuration and initialization.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
