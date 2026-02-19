'use server';
/**
 * @fileOverview A flow for fetching basic info from a YouTube channel using the YouTube Data API.
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

async function getChannelIdFromUrl(youtube: (apiCall: any) => Promise<any>, channelUrl: string): Promise<string> {
    // Try to extract from known URL patterns first
    let match = channelUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Try to extract handle and search for it
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
    const youtube = await (await getYoutubeClient()).execute;
    const channelId = await getChannelIdFromUrl(youtube, channelUrl);

    const response = await youtube(client => client.channels.list({
      part: ['snippet', 'brandingSettings', 'contentDetails'],
      id: [channelId],
    }));

    const channel = response.data.items?.[0];
    if (!channel) {
      throw new Error('YouTube channel not found after resolving ID.');
    }

    const countryCode = channel.brandingSettings?.channel?.country;
    let regionName: string | undefined = undefined;

    if (countryCode) {
        try {
            // Map the two-letter country code to its full name
            regionName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode);
        } catch (e) {
            console.warn(`Could not map country code "${countryCode}" to a region name.`);
            // If mapping fails, it's better to return nothing than an invalid code
            regionName = undefined; 
        }
    }

    return {
      name: channel.snippet?.title || 'Unknown Channel',
      logoUrl: channel.snippet?.thumbnails?.high?.url || '',
      description: channel.snippet?.description || '',
      language: channel.brandingSettings?.channel?.defaultLanguage,
      region: regionName,
    };
  }
);
