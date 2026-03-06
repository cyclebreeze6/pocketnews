/**
 * @fileOverview A flow for generating a personalized homepage configuration for a user.
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

const generateHeadlinePrompt = ai.definePrompt({
    name: 'generateHeadlinePrompt',
    input: { schema: GenerateHeadlineInputSchema },
    output: { schema: GenerateHeadlineOutputSchema },
    prompt: `You are a creative director for a news app. Your task is to generate a personalized headline and content sections based on the user's selected channels and categories.

    User's selected channels: {{#each channels}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
    User's selected categories: {{#each categories}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

    Generate a short, personal headline title (max 7 words). For example, "Your Daily Briefing" or "Top Stories for You".
    Then, create an array of content sections. Each section should have a 'channel' and a list of related 'categories' based on the user's selections.
    The layout must be 'personalized'.
    Be creative and engaging.
    `,
});

export const generateHeadlineFlow = ai.defineFlow(
  {
    name: 'generateHeadlineFlow',
    inputSchema: GenerateHeadlineInputSchema,
    outputSchema: GenerateHeadlineOutputSchema,
  },
  async (input: GenerateHeadlineInput) => {
    try {
        const { output } = await generateHeadlinePrompt(input);
        return output!;
    } catch (error) {
        console.error("AI headline generation failed, using fallback.", error);
        // Fallback in case of AI error
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
  }
);

export async function generateHeadlineConfig(input: GenerateHeadlineInput): Promise<GenerateHeadlineOutput> {
  return generateHeadlineFlow(input);
}
