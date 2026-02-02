'use server';
/**
 * @fileOverview A flow for fetching YouTube video information using the YouTube Data API.
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

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export const fetchYouTubeVideoInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeVideoInfoFlow',
    inputSchema: YouTubeVideoInfoInputSchema,
    outputSchema: YouTubeVideoInfoSchema,
  },
  async ({ videoUrl }): Promise<YouTubeVideoInfo> => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube video URL.');
    }
    
    const youtube = await (await getYoutubeClient()).execute;
    
    const response = await youtube(client => client.videos.list({
        part: ['snippet'],
        id: [videoId],
    }));

    const video = response.data.items?.[0];
    if (!video) {
        throw new Error('Video not found on YouTube.');
    }

    return {
        videoId: video.id || videoId,
        title: video.snippet?.title || 'Untitled Video',
        description: video.snippet?.description || '',
        authorName: video.snippet?.channelTitle || 'Unknown Channel',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
    };
  }
);
