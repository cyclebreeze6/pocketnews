'use server';
/**
 * @fileOverview Centralized Genkit configuration and initialization.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {firebase} from '@genkit-ai/firebase'; // For flow state and trace store
import {next} from '@genkit-ai/next';
import 'dotenv/config';

export const ai = genkit({
  plugins: [
    next(),
    firebase(), // Provides 'firebase' stores
    googleAI(), // Provides Google AI models
  ],
  flowStateStore: 'firebase', // Use Firestore to store flow states
  traceStore: 'firebase', // Use Firestore to store traces
  enableTracingAndMetrics: false, // Keep disabled to prevent any potential permission issues on startup
});
