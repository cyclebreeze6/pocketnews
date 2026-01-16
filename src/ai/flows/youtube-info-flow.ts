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
  language: z.string().optional().describe('The language of the video.'),
  region: z.string().optional().describe('The region relevant to the video.'),
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
  async (input) => {
    const videoId = getYouTubeVideoId(input.videoUrl);
    if (!videoId) {
        throw new Error('Invalid YouTube URL provided or could not extract video ID.');
    }
    
    const youtube = await getYoutubeClient();
    
    try {
        const response = await youtube.videos.list({
            part: ['snippet', 'recordingDetails'],
            id: [videoId],
        });

        const video = response.data.items?.[0];
        if (!video || !video.snippet) {
            throw new Error('Video not found or details are unavailable.');
        }
        
        const snippet = video.snippet;
        const recordingDetails = video.recordingDetails;

        const languageMap: { [key: string]: string } = {
            en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish',
            pt: 'Portuguese', sw: 'Swahili', de: 'German'
        };
        const detectedLanguage = snippet.defaultLanguage ? languageMap[snippet.defaultLanguage.split('-')[0]] : undefined;
        
        const detectedRegion = recordingDetails?.locationDescription;

        return {
            videoId: videoId,
            title: snippet.title || 'Untitled',
            description: snippet.description || '',
            authorName: snippet.channelTitle || 'Unknown Author',
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            language: detectedLanguage,
            region: detectedRegion,
        };

    } catch (error: any) {
        console.error('Error fetching video info from YouTube API:', error.message);
        if (error.response?.data?.error?.message) {
             throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
        }
        throw new Error('Could not extract video information from YouTube Data API.');
    }
  }
);
