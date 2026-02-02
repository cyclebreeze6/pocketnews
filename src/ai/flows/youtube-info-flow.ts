'use server';
/**
 * @fileOverview A flow for fetching YouTube video information using the YouTube Data API.
 * NOTE: This feature is temporarily disabled to allow application deployment.
 */

import { ai } from '../genkit';
import { z } from 'genkit';

export const YouTubeVideoInfoInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the YouTube video.'),
});
export type YouTubeVideoInfoInput = z.infer<typeof YouTubeVideoInfoInputSchema>;

export const YouTubeVideoInfoSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  authorName: z.string().describe("The name of the video's author or channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
});
export type YouTubeVideoInfo = z.infer<typeof YouTubeVideoInfoSchema>;

export const fetchYouTubeVideoInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeVideoInfoFlow',
    inputSchema: YouTubeVideoInfoInputSchema,
    outputSchema: YouTubeVideoInfoSchema,
  },
  async ({ videoUrl }): Promise<YouTubeVideoInfo> => {
    throw new Error('YouTube integration is temporarily disabled due to server configuration issues.');
  }
);
