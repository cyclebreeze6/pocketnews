'use server';
/**
 * @fileOverview A flow for fetching recent videos from a YouTube channel using the YouTube Data API.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelVideosInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
  maxResults: z.number().optional().default(15).describe('The maximum number of videos to fetch.'),
});
export type YouTubeChannelVideosInput = z.infer<typeof YouTubeChannelVideosInputSchema>;

export const YouTubeVideoDetailsSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  authorName: z.string().describe("The name of the video's author or channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

const YouTubeVideoListSchema = z.array(YouTubeVideoDetailsSchema);
export type YouTubeVideoList = z.infer<typeof YouTubeVideoListSchema>;

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

export const fetchChannelVideosFlow = ai.defineFlow(
  {
    name: 'fetchChannelVideosFlow',
    inputSchema: YouTubeChannelVideosInputSchema,
    outputSchema: YouTubeVideoListSchema,
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
    }));

    if (!response.data.items) {
      return [];
    }

    const videos: YouTubeVideoDetails[] = response.data.items.map(item => ({
      videoId: item.id?.videoId || '',
      title: item.snippet?.title || 'Untitled Video',
      description: item.snippet?.description || '',
      authorName: item.snippet?.channelTitle || '',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
    }));

    return videos.filter(video => video.videoId);
  }
);
