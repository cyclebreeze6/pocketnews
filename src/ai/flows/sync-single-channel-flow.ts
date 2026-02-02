'use server';
/**
 * @fileOverview Flow to sync a single YouTube channel.
 * NOTE: This feature is temporarily disabled to allow application deployment.
 */
import { ai } from '../genkit';
import { z } from 'zod';

export const SyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The number of new videos that were successfully added."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;


export const syncSingleYouTubeChannelFlow = ai.defineFlow(
  {
    name: 'syncSingleYouTubeChannelFlow',
    inputSchema: z.string(), // Channel ID
    outputSchema: SyncResultSchema,
  },
  async (channelId: string): Promise<SyncResult> => {
    return {
      newVideosAdded: 0,
      errors: ["Channel sync is temporarily disabled due to server environment configuration."],
    };
  }
);
