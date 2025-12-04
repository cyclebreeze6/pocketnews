'use server';
/**
 * @fileOverview A flow for fetching basic info from a YouTube channel.
 *
 * - fetchYouTubeChannelInfo - Fetches a channel's logo, name, and description from a given URL.
 * - YouTubeChannelInfoInput - The input type for the flow.
 * - YouTubeChannelInfo - The output type for the flow.
 */

import { ai } from '../genkit';
import { z } from 'genkit';

const YouTubeChannelInfoInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
});
export type YouTubeChannelInfoInput = z.infer<typeof YouTubeChannelInfoInputSchema>;

const YouTubeChannelInfoSchema = z.object({
  name: z.string().describe("The name of the channel."),
  logoUrl: z.string().url().describe("The URL for the channel's logo."),
  description: z.string().optional().describe("The channel's description."),
});
export type YouTubeChannelInfo = z.infer<typeof YouTubeChannelInfoSchema>;


export async function fetchYouTubeChannelInfo(input: YouTubeChannelInfoInput): Promise<YouTubeChannelInfo> {
  return fetchYouTubeChannelInfoFlow(input);
}

const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async (input) => {
    try {
        const response = await fetch(input.channelUrl, { redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`Failed to fetch channel page with status: ${response.status}`);
        }
        const html = await response.text();
        
        const logoMatch = html.match(/"(https:\/\/yt3\.ggpht\.com\/.*?)"/);
        const nameMatch = html.match(/"title":"(.*?)"/);
        // This regex looks for the description in the page metadata
        const descriptionMatch = html.match(/"description":{"simpleText":"(.*?)"}/);


        const logoUrl = logoMatch ? logoMatch[1].split('"')[0] : null;
        const name = nameMatch ? nameMatch[1] : null;
        const description = descriptionMatch ? descriptionMatch[1] : '';

        if (!logoUrl || !name) {
            throw new Error('Could not parse channel logo or name from the page.');
        }

        return {
            name: name,
            logoUrl: logoUrl,
            description: description,
        };

    } catch (error) {
        console.error('Error fetching channel page:', error);
        throw new Error('Could not extract channel information from the URL.');
    }
  }
);
