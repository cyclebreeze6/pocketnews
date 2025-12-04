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
        
        // Find the script tag containing the JSON with channel metadata
        const jsonScriptMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
        if (!jsonScriptMatch || !jsonScriptMatch[1]) {
            throw new Error("Could not find channel metadata JSON in page source.");
        }

        const metadata = JSON.parse(jsonScriptMatch[1]);
        
        const name = metadata.name;
        const logoUrl = metadata.image?.url;
        const description = metadata.description;


        if (!logoUrl || !name) {
            throw new Error('Could not parse channel logo or name from the page metadata.');
        }

        return {
            name: name,
            logoUrl: logoUrl,
            description: description || '',
        };

    } catch (error: any) {
        console.error('Error fetching channel page:', error);
        // Pass a more specific error up if possible
        if (error.message.includes('metadata')) {
            throw error;
        }
        throw new Error('Could not extract channel information from the URL.');
    }
  }
);
