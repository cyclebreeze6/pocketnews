'use server';
/**
 * @fileOverview Centralized Genkit configuration and initialization.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'warn', // Use 'warn' to reduce noise in production
  enableTracingAndMetrics: false, // Explicitly disable this to prevent startup issues
});
