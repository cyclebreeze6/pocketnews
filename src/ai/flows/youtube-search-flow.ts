'use server';
/**
 * @fileOverview A flow for searching for recent videos on YouTube by a query.
 * NOTE: This feature is temporarily disabled to allow application deployment.
 */

import { ai } from '../genkit';
import { z } from 'genkit';

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
    throw new Error('YouTube integration is temporarily disabled due to server configuration issues.');
  }
);
