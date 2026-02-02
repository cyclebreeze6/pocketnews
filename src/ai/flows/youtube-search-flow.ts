'use server';
/**
 * @fileOverview A flow for searching for recent videos on YouTube by a query.
 *
 * - searchYouTubeVideosFlow - Fetches a list of recent videos based on a search term.
 * - YouTubeSearchInput - The input type for the flow.
 * - YouTubeVideoDetails - The output type for a single video.
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
  async ({ query }) => {
    const youtube = await getYoutubeClient();

    const response = await youtube.execute(client => 
        client.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 12,
            type: ['video'],
            order: 'date' // Fetch most recent videos
        })
    );

    const videos: YouTubeVideoDetails[] = [];
    if (response.data.items) {
      for (const item of response.data.items) {
        if (item.id?.videoId && item.snippet) {
          videos.push({
            videoId: item.id.videoId,
            title: item.snippet.title || 'Untitled',
            description: item.snippet.description || '',
            channelTitle: item.snippet.channelTitle || '',
            thumbnailUrl: item.snippet.thumbnails?.high?.url || '',
          });
        }
      }
    }
    return videos;
  }
);
