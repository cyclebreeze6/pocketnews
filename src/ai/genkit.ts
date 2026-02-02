'use server';
/**
 * @fileOverview Centralized Genkit configuration and initialization.
 * NOTE: All Genkit and server-side AI functionality has been temporarily disabled to allow the application to deploy.
 * The underlying cloud environment requires additional permissions to run these services.
 */

// A mock AI object to prevent import errors in other files.
export const ai: any = {
  defineFlow: (config: any, implementation: any) => implementation,
  definePrompt: () => () => Promise.resolve({}),
  defineTool: () => () => Promise.resolve({}),
};
