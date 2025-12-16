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
  async (input) => {
    const youtube = await getYoutubeClient();
    
    try {
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: input.query,
            type: ['video'],
            order: 'date', // Get the most recent videos
            maxResults: 20,
        });

        const videos: YouTubeVideoList = [];
        const items = searchResponse.data.items;
        
        if (items) {
            for (const item of items) {
                const { id, snippet } = item;
                if (id?.videoId && snippet) {
                    videos.push({
                        videoId: id.videoId,
                        title: snippet.title || 'Untitled',
                        description: snippet.description || '',
                        channelTitle: snippet.channelTitle || 'Unknown Channel',
                        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
                    });
                }
            }
        }
        
        return videos;

    } catch (error: any) {
        console.error('Error searching YouTube videos:', error.message);
        if (error.response?.data?.error?.message) {
             throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
        }
        throw new Error('Could not complete the video search. The API may be unavailable.');
    }
  }
);
