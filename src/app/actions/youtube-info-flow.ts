'use server';
/**
 * @fileOverview A flow for fetching YouTube video information.
 *
 * - fetchYouTubeVideoInfo - A function that fetches video details from a YouTube URL.
 * - YouTubeVideoInfoInput - The input type for the flow.
 * - YouTubeVideoInfo - The output type for the flow.
 */

import { ai } from '../../ai/genkit';
import { z } from 'genkit';

const YouTubeVideoInfoInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the YouTube video.'),
});
export type YouTubeVideoInfoInput = z.infer<typeof YouTubeVideoInfoInputSchema>;

const YouTubeVideoInfoSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  authorName: z.string().describe("The name of the video's author or channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
});
export type YouTubeVideoInfo = z.infer<typeof YouTubeVideoInfoSchema>;

// This is the exported wrapper function that your client-side code will call.
export async function fetchYouTubeVideoInfo(input: YouTubeVideoInfoInput): Promise<YouTubeVideoInfo> {
  return fetchYouTubeVideoInfoFlow(input);
}

// Helper function to extract video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

const fetchYouTubeVideoInfoFlow = ai.defineFlow(
  {
    name: 'fetchYouTubeVideoInfoFlow',
    inputSchema: YouTubeVideoInfoInputSchema,
    outputSchema: YouTubeVideoInfoSchema,
  },
  async (input) => {
    const videoId = getYouTubeVideoId(input.videoUrl);
    if (!videoId) {
        throw new Error('Invalid YouTube URL provided.');
    }
    
    // Using YouTube's public oEmbed endpoint, which doesn't require an API key.
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    const response = await fetch(oembedUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch YouTube video data. Status: ${response.status}`);
    }

    const data = await response.json();

    // YouTube oEmbed doesn't provide a description, so we'll generate a placeholder.
    // A more advanced implementation could use the YouTube Data API for a full description.
    const description = `Details for the video titled "${data.title}".`;

    return {
        videoId: videoId,
        title: data.title || 'Untitled',
        description: description,
        authorName: data.author_name || 'Unknown Author',
        thumbnailUrl: data.thumbnail_url || '',
    };
  }
);
