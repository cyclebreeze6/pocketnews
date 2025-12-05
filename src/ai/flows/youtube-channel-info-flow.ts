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
});
export type YouTubeChannelInfo = z.infer<typeof YouTubeChannelInfoSchema>;

async function getChannelIdFromUrl(url: string): Promise<string | null> {
    const youtube = await getYoutubeClient();
    const urlParts = url.split('/').filter(p => p);
    const lastPart = urlParts[urlParts.length - 1];

    if (!lastPart) return null;

    // 1. Direct Channel ID URL
    if (url.includes('/channel/')) {
        return lastPart;
    }

    // 2. Handle or Username URL (e.g., /@handle or /user/username or /c/customname)
    const identifier = lastPart.startsWith('@') ? lastPart.substring(1) : lastPart;
    
    try {
        // First, try searching by the handle/name which is often reliable for handles.
        const searchResponse = await youtube.search.list({
            part: ['id'],
            q: identifier,
            type: ['channel'],
            maxResults: 1
        });
        const channelId = searchResponse.data.items?.[0]?.id?.channelId;
        if (channelId) return channelId;

    } catch (error) {
        console.warn('YouTube search by handle failed, trying username fallback.', error);
    }
    
    try {
        // Fallback for older /user/ or /c/ style URLs if search fails
        const channelsResponse = await youtube.channels.list({
            part: ['id'],
            forUsername: identifier,
            maxResults: 1
        });
        const channelId = channelsResponse.data.items?.[0]?.id;
        if (channelId) return channelId;
    }
    catch (error) {
         console.warn('YouTube forUsername lookup failed.', error);
    }
    
    return null; // If all methods fail
}

export const fetchYouTubeChannelInfoFlow = ai.defineFlow(
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
        // Provide a more specific error message to the user
        if (error.message.includes('ID')) {
             throw new Error('Could not find a valid YouTube channel ID from the provided URL. Please check the link.');
        }
        throw new Error('Could not extract channel information. The API may be unavailable or the URL is incorrect.');
    }
  }
);
