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


// Helper to get a specific identifier from a YouTube URL
function getChannelIdentifierFromUrl(url: string): { type: 'id' | 'handle' | 'legacy' | 'unknown', value: string } {
    const channelIdRegex = /(?:youtube\.com\/channel\/)(UC[\w-]{22})/;
    const handleRegex = /(?:youtube\.com\/)(@[\w-._]+)/;
    const legacyRegex = /(?:youtube\.com\/(?:c|user)\/)([\w-]+)/;

    let match = url.match(channelIdRegex);
    if (match && match[1]) {
        return { type: 'id', value: match[1] };
    }

    match = url.match(handleRegex);
    if (match && match[1]) {
        return { type: 'handle', value: match[1] };
    }
    
    match = url.match(legacyRegex);
    if (match && match[1]) {
        return { type: 'legacy', value: match[1] };
    }

    return { type: 'unknown', value: url };
}


export const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async (input) => {
    const youtube = await getYoutubeClient();
    
    let channelId: string | undefined;
    const identifier = getChannelIdentifierFromUrl(input.channelUrl);

    try {
        if (identifier.type === 'id') {
            channelId = identifier.value;
        } else {
            // For handles, legacy names, or unknown formats, use the search API.
            const searchResponse = await youtube.search.list({
                part: ['id'],
                q: identifier.value,
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
        if (error.response?.data?.error?.message) {
             throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
        }
        throw new Error('Could not extract channel information. The API may be unavailable or the URL is incorrect.');
    }
  }
);
