/**
 * @fileOverview A flow for fetching basic info from a YouTube channel using the YouTube Data API.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';
import { COUNTRY_TO_CONTINENT } from '../../lib/region-map';

const YouTubeChannelInfoInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
});
export type YouTubeChannelInfoInput = z.infer<typeof YouTubeChannelInfoInputSchema>;

const YouTubeChannelInfoSchema = z.object({
  youtubeChannelId: z.string().describe("The unique YouTube ID of the channel (UC...)."),
  name: z.string().describe("The name of the channel."),
  logoUrl: z.string().url().describe("The URL for the channel's logo."),
  description: z.string().optional().describe("The channel's description."),
  language: z.string().optional().describe('The default language of the channel.'),
  region: z.array(z.string()).optional().describe('The country and continent associated with the channel.'),
});
export type YouTubeChannelInfo = z.infer<typeof YouTubeChannelInfoSchema>;

async function getChannelIdFromUrl(youtube: (apiCall: any) => Promise<any>, channelUrl: string): Promise<string> {
    // Try to extract from known URL patterns first (Free)
    let match = channelUrl.match(/channel\/([a-zA-Z0-9_-]{24})/);
    if (match) return match[1];

    // Try to extract handle and search for it (Requires API)
    match = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) {
        const handle = match[1];
        const searchResponse = await youtube((client: any) => client.search.list({
            part: ['snippet'],
            q: handle,
            type: ['channel'],
            maxResults: 1
        }));
        const foundChannelId = searchResponse.data.items?.[0]?.snippet?.channelId;
        if (foundChannelId) return foundChannelId;
    }
    
    // Try legacy username
    match = channelUrl.match(/user\/([a-zA-Z0-9_-]+)/);
    if (match) {
         const username = match[1];
         const channelsResponse = await youtube((client: any) => client.channels.list({
             part: ['id'],
             forUsername: username
         }));
         const foundChannelId = channelsResponse.data.items?.[0]?.id;
         if (foundChannelId) return foundChannelId;
    }

    throw new Error('Could not resolve a valid YouTube Channel ID from the provided URL.');
}

export const fetchYouTubeChannelInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeChannelInfoFlow',
    inputSchema: YouTubeChannelInfoInputSchema,
    outputSchema: YouTubeChannelInfoSchema,
  },
  async ({ channelUrl }) => {
    const client = await getYoutubeClient();
    const channelId = await getChannelIdFromUrl(client.execute, channelUrl);

    const response = await client.execute(youtube => youtube.channels.list({
      part: ['snippet', 'brandingSettings', 'contentDetails'],
      id: [channelId],
    }));

    const channel = response.data.items?.[0];
    if (!channel) {
      throw new Error('YouTube channel not found after resolving ID.');
    }

    const countryCode = channel.brandingSettings?.channel?.country;
    const regions: string[] = [];

    if (countryCode) {
        try {
            // Map the two-letter country code to its full name
            const regionName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode);
            if (regionName) {
                regions.push(regionName);
                // Find and add the continent
                const continent = COUNTRY_TO_CONTINENT[regionName];
                if (continent && !regions.includes(continent)) {
                    regions.push(continent);
                }
            }
        } catch (e) {
            console.warn(`Could not map country code "${countryCode}" to a region name.`);
        }
    }

    return {
      youtubeChannelId: channelId,
      name: channel.snippet?.title || 'Unknown Channel',
      logoUrl: channel.snippet?.thumbnails?.high?.url || '',
      description: channel.snippet?.description || '',
      language: channel.brandingSettings?.channel?.defaultLanguage,
      region: regions.length > 0 ? regions : undefined,
    };
  }
);
