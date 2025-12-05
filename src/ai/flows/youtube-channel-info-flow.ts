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

/**
 * Extracts a potential channel identifier (handle, custom name, or ID) from a YouTube URL.
 * @param url The full YouTube channel URL.
 * @returns A string identifier or null if one cannot be found.
 */
function getIdentifierFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p); 

        // Check for /channel/UC... format
        const channelIdIndex = pathParts.indexOf('channel');
        if (channelIdIndex !== -1 && pathParts[channelIdIndex + 1]?.startsWith('UC')) {
            return pathParts[channelIdIndex + 1];
        }

        // Check for /c/ or /user/ formats
        const legacyVanityIndex = pathParts.findIndex(p => p === 'c' || p === 'user');
        if (legacyVanityIndex !== -1 && pathParts[legacyVanityIndex + 1]) {
            return pathParts[legacyVanityIndex + 1];
        }
        
        // Check for @handle format
        const handle = pathParts.find(p => p.startsWith('@'));
        if (handle) {
            return handle.substring(1); // Remove '@'
        }

        // As a fallback, take the last part of the path
        if (pathParts.length > 0) {
            return pathParts[pathParts.length - 1];
        }

        return null;
    } catch (e) {
        console.error("Invalid URL provided to getIdentifierFromUrl", e);
        return null;
    }
}


export const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async (input) => {
    const youtube = await getYoutubeClient();
    const identifier = getIdentifierFromUrl(input.channelUrl);

    if (!identifier) {
        throw new Error('Could not find a valid identifier in the YouTube URL.');
    }
    
    try {
        // Use the search API as a robust way to find a channel by its handle, custom URL, or even name.
        // It's more reliable than trying to guess the URL structure.
        const searchResponse = await youtube.search.list({
            part: ['id'],
            q: identifier, // The search query is the identifier from the URL.
            type: ['channel'],
            maxResults: 1
        });
        
        const channelId = searchResponse.data.items?.[0]?.id?.channelId;

        if (!channelId) {
            throw new Error(`Could not find a YouTube channel matching "${identifier}". Please check the URL.`);
        }

        // Now with a confirmed channelId, get the full details.
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
            // Prefer high quality thumbnail
            logoUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        };

    } catch (error: any) {
        console.error('Error fetching channel info from YouTube API:', error.message);
        // Provide a more specific error message to the user
        if (error.response?.data?.error?.message) {
             throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
        }
        throw new Error('Could not extract channel information. The API may be unavailable or the URL is incorrect.');
    }
  }
);
