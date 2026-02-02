'use server';
/**
 * @fileOverview A flow for fetching recent shorts from a YouTube channel using the YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelShortsInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
  maxResults: z.number().optional().default(25).describe('The maximum number of shorts to fetch.'),
});
export type YouTubeChannelShortsInput = z.infer<typeof YouTubeChannelShortsInputSchema>;

export const YouTubeShortDetailsSchema = z.object({
  youtubeVideoId: z.string().describe('The unique ID of the YouTube short.'),
  title: z.string().describe('The title of the short.'),
  thumbnailUrl: z.string().url().describe('The URL for the short thumbnail.'),
});
export type YouTubeShortDetails = z.infer<typeof YouTubeShortDetailsSchema>;

const YouTubeShortListSchema = z.array(YouTubeShortDetailsSchema);
export type YouTubeShortList = z.infer<typeof YouTubeShortListSchema>;

async function getChannelIdFromUrl(youtube: (apiCall: any) => Promise<any>, channelUrl: string): Promise<string> {
    let match = channelUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    match = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) {
        const handle = match[1];
        const searchResponse = await youtube((client: any) => client.search.list({ part: ['snippet'], q: handle, type: ['channel'], maxResults: 1 }));
        const foundId = searchResponse.data.items?.[0]?.snippet?.channelId;
        if (foundId) return foundId;
    }
    
    match = channelUrl.match(/user\/([a-zA-Z0-9_-]+)/);
    if (match) {
         const username = match[1];
         const channelsResponse = await youtube((client: any) => client.channels.list({ part: ['id'], forUsername: username }));
         const foundId = channelsResponse.data.items?.[0]?.id;
         if (foundId) return foundId;
    }

    throw new Error('Could not resolve YouTube Channel ID from URL.');
}

export const fetchChannelShortsFlow = ai.defineFlow(
  {
    name: 'fetchChannelShortsFlow',
    inputSchema: YouTubeChannelShortsInputSchema,
    outputSchema: YouTubeShortListSchema,
  },
  async ({ channelUrl, maxResults }) => {
    const youtube = await (await getYoutubeClient()).execute;
    const channelId = await getChannelIdFromUrl(youtube, channelUrl);

    const response = await youtube(client => client.search.list({
        part: ['snippet'],
        channelId: channelId,
        maxResults: maxResults,
        order: 'date',
        type: ['video'],
        videoDuration: 'short',
    }));

    if (!response.data.items) {
      return [];
    }

    const shorts: YouTubeShortDetails[] = response.data.items.map(item => ({
      youtubeVideoId: item.id?.videoId || '',
      title: item.snippet?.title || 'Untitled Short',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
    }));

    return shorts.filter(short => short.youtubeVideoId);
  }
);
