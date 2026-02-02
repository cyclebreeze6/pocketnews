'use server';
/**
 * @fileOverview A flow for fetching YouTube video information using the YouTube Data API.
 *
 * - fetchYouTubeVideoInfoFlow - A function that fetches video details from a YouTube URL.
 * - YouTubeVideoInfoInput - The input type for the flow.
 * - YouTubeVideoInfo - The output type for the flow.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

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
  async ({ videoUrl }) => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Could not extract a valid YouTube video ID from the URL.');
    }
    
    const youtube = await getYoutubeClient();

    const response = await youtube.execute(client => 
        client.videos.list({
            part: ['snippet'],
            id: [videoId],
        })
    );

    const video = response.data.items?.[0];
    
    if (!video || !video.snippet) {
      throw new Error(`No video found with ID: ${videoId}`);
    }

    return {
      videoId: videoId,
      title: video.snippet.title || 'Untitled',
      description: video.snippet.description || '',
      authorName: video.snippet.channelTitle || 'Unknown Channel',
      thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || '',
    };
  }
);
