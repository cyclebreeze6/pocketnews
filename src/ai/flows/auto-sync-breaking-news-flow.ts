'use server';
/**
 * @fileOverview Flow to automatically sync breaking news. This feature is currently disabled.
 */
import { ai } from '../genkit';
import { z } from 'zod';

const AutoSyncResultSchema = z.object({
  newVideosAdded: z.number().describe("The total number of new videos added as Breaking News."),
  syncedChannels: z.number().describe("The number of channels that were processed."),
  errors: z.array(z.string()).optional().describe('A list of errors encountered during the sync process.'),
});
export type AutoSyncResult = z.infer<typeof AutoSyncResultSchema>;

const autoSyncBreakingNewsFlow = ai.defineFlow(
  {
    name: 'autoSyncBreakingNewsFlow',
    outputSchema: AutoSyncResultSchema,
  },
  async () => {
    console.log('autoSyncBreakingNewsFlow triggered, but is disabled.');
    // Return a successful-looking result with no changes.
    return { newVideosAdded: 0, syncedChannels: 0, errors: ["This feature is disabled."] };
  }
);

export async function runAutoSyncBreakingNewsFlow(): Promise<AutoSyncResult> {
  return autoSyncBreakingNewsFlow();
}
