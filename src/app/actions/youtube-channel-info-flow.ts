'use server';
/**
 * @fileOverview A flow for fetching basic info from a YouTube channel using the YouTube Data API.
 *
 * - fetchYouTubeChannelInfo - Fetches a channel's logo, name, and description from a given URL.
 * - YouTubeChannelInfoInput - The input type for the flow.
 * - YouTubeChannelInfo - The output type for the flow.
 */

import { ai } from '../../ai/genkit';
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
});
export type YouTubeChannelInfo = z.infer<typeof YouTubeChannelInfoSchema>;


export async function fetchYouTubeChannelInfo(input: YouTubeChannelInfoInput): Promise<YouTubeChannelInfo> {
  return fetchYouTubeChannelInfoFlow(input);
}

async function getChannelIdFromUrl(url: string): Promise<string | null> {
    const youtube = await getYoutubeClient();
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    
    if (url.includes('/channel/')) {
        // Standard channel URL
        return lastPart;
    } else if (url.includes('/@') || url.includes('/c/')) {
        // Custom handle or legacy username URL
        const searchResponse = await youtube.search.list({
            part: ['id'],
            q: lastPart,
            type: ['channel'],
            maxResults: 1
        });
        return searchResponse.data.items?.[0]?.id?.channelId || null;
    }
    return null; // Could not determine ID
}


const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async (input) => {
    const youtube = await getYoutubeClient();
    try {
        const channelId = await getChannelIdFromUrl(input.channelUrl);
        if (!channelId) {
            throw new Error('Could not determine the YouTube Channel ID from the URL.');
        }

        const channelResponse = await youtube.channels.list({
            part: ['snippet'],
            id: [channelId]
        });

        const channel = channelResponse.data.items?.[0];
        if (!channel) {
            throw new Error('Channel not found using the provided URL.');
        }
        
        const snippet = channel.snippet;

        return {
            name: snippet?.title || 'Unknown Channel',
            description: snippet?.description || '',
            // Prefer high quality thumbnail
            logoUrl: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || '',
        };

    } catch (error: any) {
        console.error('Error fetching channel info from YouTube API:', error);
        throw new Error('Could not extract channel information from the YouTube API.');
    }
  }
);
