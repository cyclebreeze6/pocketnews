'use server';
/**
 * @fileOverview A flow for generating a personalized homepage configuration for a user.
 *
 * - generateHeadlineConfig - A function that creates a personalized headline and content sections.
 * - GenerateHeadlineInput - The input type for the flow.
 * - GenerateHeadlineOutput - The output type for the flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHeadlineInputSchema = z.object({
  channels: z.array(z.string()).describe('A list of channel names selected by the user.'),
  categories: z.array(z.string()).describe('A list of category names selected by the user.'),
});
export type GenerateHeadlineInput = z.infer<typeof GenerateHeadlineInputSchema>;

const GenerateHeadlineOutputSchema = z.object({
  headlineTitle: z.string().max(40).describe('A short, personal headline title (max 7 words).'),
  sections: z
    .array(
      z.object({
        channel: z.string().describe('The name of the channel for this section.'),
        categories: z.array(z.string()).describe('A list of related categories for this channel.'),
      })
    )
    .describe('An array of content sections built from the selected channels.'),
  layout: z.literal('personalized').describe("The layout type, which must be 'personalized'."),
});
export type GenerateHeadlineOutput = z.infer<typeof GenerateHeadlineOutputSchema>;

const generateHeadlineFlow = ai.defineFlow(
  {
    name: 'generateHeadlineFlow',
    inputSchema: GenerateHeadlineInputSchema,
    outputSchema: GenerateHeadlineOutputSchema,
  },
  async (input) => {
    // AI functionality is disabled. Using fallback logic.
    if (!input.channels || input.channels.length === 0) {
      return {
        headlineTitle: 'My Headlines',
        sections: input.categories.map(cat => ({ channel: cat, categories: [cat] })),
        layout: 'personalized',
      };
    }

    // A simple fallback: just assign all categories to the first channel
    const sections = input.channels.map(channel => {
        return {
            channel: channel,
            categories: input.categories
        }
    });

    return {
        headlineTitle: 'My Headlines',
        sections: sections,
        layout: 'personalized',
    };
  }
);


export async function generateHeadlineConfig(input: GenerateHeadlineInput): Promise<GenerateHeadlineOutput> {
  return generateHeadlineFlow(input);
}
