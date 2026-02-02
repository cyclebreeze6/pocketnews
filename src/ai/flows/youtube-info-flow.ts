/**
 * @fileOverview A flow for fetching YouTube video information using the YouTube Data API.
 *
 * - fetchYouTubeVideoInfoFlow - A function that fetches video details from a YouTube URL.
 * - YouTubeVideoInfoInput - The input type for the flow.
 * - YouTubeVideoInfo - The output type for the flow.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
// import { getYoutubeClient } from '../../lib/youtube-client';

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

// Helper function to extract video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export const fetchYouTubeVideoInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeVideoInfoFlow',
    inputSchema: YouTubeVideoInfoInputSchema,
    outputSchema: YouTubeVideoInfoSchema,
  },
  async (input: any) => {
    console.warn('[fetchYouTubeVideoInfoFlow] Temporarily disabled to ensure application stability.');
    throw new Error('Fetching YouTube video info is temporarily disabled to ensure application stability.');
  }
);

    
