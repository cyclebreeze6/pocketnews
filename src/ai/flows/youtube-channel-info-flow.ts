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

/**
 * Extracts a potential channel identifier (handle, custom name, or ID) from a YouTube URL.
 * This is a more robust implementation.
 * @param url The full YouTube channel URL.
 * @returns A string identifier or null if one cannot be found.
 */
function getIdentifierFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // pathname can be like /c/Google, /channel/ID, /@Google, /Google
        const pathParts = urlObj.pathname.split('/').filter(p => p);

        // Order of checks is important, from most specific to least specific.

        // 1. /channel/UC... (Canonical ID)
        if (pathParts[0] === 'channel' && pathParts[1]?.startsWith('UC')) {
            return pathParts[1];
        }

        // 2. /@handle
        if (pathParts[0]?.startsWith('@')) {
            return pathParts[0];
        }

        // 3. /c/customUrl or /user/legacyUsername
        if ((pathParts[0] === 'c' || pathParts[0] === 'user') && pathParts[1]) {
            return pathParts[1];
        }

        // 4. Fallback for root-level vanity names (e.g., youtube.com/Google)
        // This is the most ambiguous, so it's last.
        // Make sure it's a single path part and doesn't look like another reserved path.
        if (pathParts.length === 1 && !['watch', 'results', 'feed', 'playlist', 'shorts'].includes(pathParts[0])) {
            return pathParts[0];
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
        throw new Error('Could not find a valid channel identifier in the YouTube URL. Please use a channel URL, not a video URL.');
    }
    
    try {
        // Use the search API as a robust way to find a channel by its handle, custom URL, or even name.
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

        const languageMap: { [key: string]: string } = {
            en: 'English',
            fr: 'French',
            ar: 'Arabic',
            es: 'Spanish',
            pt: 'Portuguese',
            sw: 'Swahili',
            de: 'German',
        };
        const detectedLanguage = snippet.defaultLanguage ? languageMap[snippet.defaultLanguage.split('-')[0]] : undefined;

        return {
            name: snippet.title || 'Unknown Channel',
            description: snippet.description || '',
            logoUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            language: detectedLanguage,
            region: snippet.country,
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
