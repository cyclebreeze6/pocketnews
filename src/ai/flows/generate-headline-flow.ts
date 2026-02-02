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


const headlinePrompt = ai.definePrompt({
    name: 'headlinePrompt',
    input: { schema: GenerateHeadlineInputSchema },
    output: { schema: GenerateHeadlineOutputSchema },
    prompt: `You are a TV news curator. Given a list of channels and categories, create a personalized layout.
    - The headline title should be short and engaging.
    - Group the categories under the most relevant channels. A channel can have multiple categories. A category can appear in multiple channels if relevant.
    - Ensure all given channels are used in the sections.
    - Ensure all given categories are distributed among the sections.

    Channels:
    {{#each channels}}
    - {{this}}
    {{/each}}

    Categories:
    {{#each categories}}
    - {{this}}
    {{/each}}

    Your output must be in the 'personalized' layout format.`,
});


const generateHeadlineFlow = ai.defineFlow(
  {
    name: 'generateHeadlineFlow',
    inputSchema: GenerateHeadlineInputSchema,
    outputSchema: GenerateHeadlineOutputSchema,
  },
  async (input) => {
    const { output } = await headlinePrompt(input);
    if (output) {
      return output;
    }

    // Fallback in case AI fails
    const fallbackSections = input.channels.length > 0 
        ? input.channels.map(channel => ({
            channel: channel,
            categories: input.categories
          }))
        : input.categories.map(cat => ({ channel: cat, categories: [cat] }));

    return {
        headlineTitle: 'My Headlines',
        sections: fallbackSections,
        layout: 'personalized',
    };
  }
);


export async function generateHeadlineConfig(input: GenerateHeadlineInput): Promise<GenerateHeadlineOutput> {
  return generateHeadlineFlow(input);
}
