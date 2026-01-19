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


export const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async (input) => {
    const youtube = await getYoutubeClient();
    let channelId: string | undefined;

    try {
        const trimmedUrl = input.channelUrl.trim();
        // Regex for standard Channel ID (UC..., HC..., KC...)
        const channelIdRegex = /(?:youtube\.com\/channel\/)([\w-]{24})/;
        const match = trimmedUrl.match(channelIdRegex);

        if (match && match[1]) {
            // If we find a standard channel ID, use it directly.
            channelId = match[1];
        } else {
            // For all other URL types (@handle, /c/name, /user/name), use the search API.
            const searchResponse = await youtube.search.list({
                part: ['id'],
                q: trimmedUrl,
                type: ['channel'],
                maxResults: 1
            });
            channelId = searchResponse.data.items?.[0]?.id?.channelId;
        }

        if (!channelId) {
            throw new Error(`Could not find a YouTube channel matching the provided URL. Please check the URL.`);
        }

        const channelResponse = await youtube.channels.list({
            part: ['snippet'],
            id: [channelId]
        });

        const channel = channelResponse.data.items?.[0];
        if (!channel?.snippet) {
            throw new Error('Channel details not found after finding ID. The channel may be unavailable.');
        }
        
        const { snippet } = channel;

        return {
            name: snippet.title || 'Unknown Channel',
            description: snippet.description || '',
            logoUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        };

    } catch (error: any) {
        console.error('Error fetching channel info from YouTube API:', error.message);
        if (error.response?.data?.error?.message) {
             throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
        }
        throw new Error(error.message || 'Could not extract channel information. The API may be unavailable or the URL is incorrect.');
    }
  }
);
