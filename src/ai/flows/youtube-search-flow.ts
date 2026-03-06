/**
 * @fileOverview A flow for searching for recent videos on YouTube by a query.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeSearchInputSchema = z.object({
  query: z.string().describe('The search term to look for on YouTube.'),
});
export type YouTubeSearchInput = z.infer<typeof YouTubeSearchInputSchema>;

export const YouTubeVideoDetailsSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  channelTitle: z.string().describe("The name of the video's channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

const YouTubeVideoListSchema = z.array(YouTubeVideoDetailsSchema);
export type YouTubeVideoList = z.infer<typeof YouTubeVideoListSchema>;


export const searchYouTubeVideosFlow = ai.defineFlow(
  {
    name: 'searchYouTubeVideosFlow',
    inputSchema: YouTubeSearchInputSchema,
    outputSchema: YouTubeVideoListSchema,
  },
  async ({ query }): Promise<YouTubeVideoList> => {
    const youtube = await (await getYoutubeClient()).execute;
    
    const response = await youtube(client => client.search.list({
        part: ['snippet'],
        q: query,
        maxResults: 20,
        type: ['video'],
        order: 'relevance',
    }));

    if (!response.data.items) {
        return [];
    }

    const videos: YouTubeVideoDetails[] = response.data.items.map(item => ({
        videoId: item.id?.videoId || '',
        title: item.snippet?.title || 'Untitled Video',
        description: item.snippet?.description || '',
        channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
    }));

    return videos.filter(video => video.videoId);
  }
);
