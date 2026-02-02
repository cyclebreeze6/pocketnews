'use server';
/**
 * @fileOverview A flow for fetching basic info from a YouTube channel using the YouTube Data API.
 *
 * - fetchYouTubeChannelInfoFlow - Fetches a channel's logo, name, and description from a given URL.
 * - YouTubeChannelInfoInput - The input type for the flow.
 * - YouTubeChannelInfo - The output type for the flow.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelInfoInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
});
export type YouTubeChannelInfoInput = z.infer<typeof YouTubeChannelInfoInputSchema>;

const YouTubeChannelInfoSchema = z.object({
  name: z.string().describe("The name of the channel."),
  logoUrl: z.string().url().describe("The URL for the channel's logo."),
  description: z.string().optional().describe("The channel's description."),
  language: z.string().optional().describe('The default language of the channel.'),
  region: z.string().optional().describe('The country associated with the channel.'),
});
export type YouTubeChannelInfo = z.infer<typeof YouTubeChannelInfoSchema>;


// Helper function to extract channel handle from various YouTube URL formats
function getYouTubeChannelHandle(url: string): string | null {
    const handleRegex = /@([a-zA-Z0-9_\-.]+)/;
    const match = url.match(handleRegex);
    return match ? match[1] : null;
}

export const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async ({ channelUrl }) => {
    const handle = getYouTubeChannelHandle(channelUrl);
    if (!handle) {
      throw new Error('Could not extract a valid YouTube channel handle from the URL.');
    }

    const youtube = await getYoutubeClient();
    const response = await youtube.execute(client => 
        client.channels.list({
            part: ['snippet', 'brandingSettings', 'contentDetails'],
            forHandle: handle,
        })
    );

    const channel = response.data.items?.[0];
    if (!channel) {
        throw new Error(`No YouTube channel found for handle: @${handle}`);
    }

    const snippet = channel.snippet;
    if (!snippet || !snippet.title || !snippet.thumbnails?.high?.url) {
        throw new Error('Incomplete channel data received from YouTube API.');
    }

    return {
        name: snippet.title,
        logoUrl: snippet.thumbnails.high.url,
        description: snippet.description || '',
        language: snippet.defaultLanguage || '',
        region: snippet.country || '',
    };
  }
);
