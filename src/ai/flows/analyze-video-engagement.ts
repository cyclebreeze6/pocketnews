'use server';

/**
 * @fileOverview A video engagement analysis AI agent.
 *
 * - analyzeVideoEngagement - A function that handles the video engagement analysis process.
 * - AnalyzeVideoEngagementInput - The input type for the analyzeVideoEngagement function.
 * - AnalyzeVideoEngagementOutput - The return type for the analyzeVideoEngagement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVideoEngagementInputSchema = z.object({
  videoViews: z.number().describe('The number of views for the video.'),
  watchTime: z.number().describe('The total watch time for the video in minutes.'),
  userDemographics: z
    .string()
    .describe(
      'A description of the user demographics watching the video (e.g., age, gender, location).' ),
  contentCategory: z.string().describe('The category of the video content.'),
});
export type AnalyzeVideoEngagementInput = z.infer<typeof AnalyzeVideoEngagementInputSchema>;

const AnalyzeVideoEngagementOutputSchema = z.object({
  keyInsights: z
    .string()
    .describe(
      'Key insights into what content strategies are most effective based on the provided metrics.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for optimizing channel content based on the engagement analysis.'
    ),
});
export type AnalyzeVideoEngagementOutput = z.infer<typeof AnalyzeVideoEngagementOutputSchema>;

export async function analyzeVideoEngagement(
  input: AnalyzeVideoEngagementInput
): Promise<AnalyzeVideoEngagementOutput> {
  return analyzeVideoEngagementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVideoEngagementPrompt',
  input: {schema: AnalyzeVideoEngagementInputSchema},
  output: {schema: AnalyzeVideoEngagementOutputSchema},
  prompt: `You are an expert in video content strategy and audience engagement. Analyze the following video engagement metrics and provide key insights and recommendations for optimizing channel content.

Video Views: {{{videoViews}}}
Watch Time (minutes): {{{watchTime}}}
User Demographics: {{{userDemographics}}}
Content Category: {{{contentCategory}}}

Based on this data, what content strategies are most effective, and what recommendations can you provide to improve channel performance?`,
});

const analyzeVideoEngagementFlow = ai.defineFlow(
  {
    name: 'analyzeVideoEngagementFlow',
    inputSchema: AnalyzeVideoEngagementInputSchema,
    outputSchema: AnalyzeVideoEngagementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
