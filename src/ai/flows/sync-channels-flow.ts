'use server';
/**
 * @fileOverview Flow to sync all YouTube channels and add new videos.
 * NOTE: This feature is temporarily disabled to allow application deployment.
 */
import { ai } from '../genkit';
import { z } from 'zod';

export const FetchResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos that were successfully added across all channels."),
  syncedChannels: z.number().describe("The number of channels that were successfully synced."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type FetchResult = z.infer<typeof FetchResultSchema>;

export const fetchNewYouTubeVideosFlow = ai.defineFlow(
  {
    name: 'fetchNewYouTubeVideosFlow',
    outputSchema: FetchResultSchema,
  },
  async (): Promise<FetchResult> => {
    return {
      newVideosAdded: 0,
      syncedChannels: 0,
      errors: ["Channel sync is temporarily disabled due to server environment configuration."],
    };
  }
);
