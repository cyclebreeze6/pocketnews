'use server';
/**
 * @fileOverview Flow to automatically sync breaking news from configured channels.
 * NOTE: This feature is temporarily disabled to allow application deployment.
 */
import { ai } from '../genkit';
import { z } from 'zod';

const AutoSyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos added as Breaking News."),
  syncedChannels: z.number().describe("The number of channels that were processed."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type AutoSyncResult = z.infer<typeof AutoSyncResultSchema>;

async function disabledFlow(): Promise<AutoSyncResult> {
    return {
        newVideosAdded: 0,
        syncedChannels: 0,
        errors: ["This feature is temporarily disabled due to server environment configuration."],
    };
}

export const runAutoSyncBreakingNewsFlow = ai.defineFlow(
  {
    name: 'autoSyncBreakingNewsFlow',
    outputSchema: AutoSyncResultSchema,
  },
  disabledFlow
);
