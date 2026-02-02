
'use server';
/**
 * @fileOverview Mock Genkit AI instance.
 *
 * This file provides a mock 'ai' object to prevent server startup crashes
 * related to Genkit initialization in the current hosting environment.
 * All AI-related functionality is effectively disabled, allowing the rest of
 * the application to function correctly.
 */

// This mock returns the flow function directly, bypassing Genkit's processing.
// It allows the application's non-AI flows (like YouTube sync) to work as plain async functions.
const aiMock = {
  defineFlow: (_: any, fn: any) => fn,
  // This mock returns a function that resolves to null, disabling AI prompts.
  definePrompt: (_: any) => {
    return () => Promise.resolve({ output: null });
  },
  defineTool: (_: any, fn: any) => fn,
};

// Export the mock object with a type assertion to satisfy TypeScript.
export const ai = aiMock as any;
