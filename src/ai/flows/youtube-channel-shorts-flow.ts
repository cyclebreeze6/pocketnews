'use server';
/**
 * @fileOverview A flow for fetching recent shorts from a YouTube channel using the YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'genkit';
// import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelShortsInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
  maxResults: z.number().optional().default(25).describe('The maximum number of shorts to fetch.'),
});
export type YouTubeChannelShortsInput = z.infer<typeof YouTubeChannelShortsInputSchema>;

export const YouTubeShortDetailsSchema = z.object({
  youtubeVideoId: z.string().describe('The unique ID of the YouTube short.'),
  title: z.string().describe('The title of the short.'),
  thumbnailUrl: z.string().url().describe('The URL for the short thumbnail.'),
});
export type YouTubeShortDetails = z.infer<typeof YouTubeShortDetailsSchema>;

const YouTubeShortListSchema = z.array(YouTubeShortDetailsSchema);
export type YouTubeShortList = z.infer<typeof YouTubeShortListSchema>;


export const fetchChannelShortsFlow = ai.defineFlow(
  {
    name: 'fetchChannelShortsFlow',
    inputSchema: YouTubeChannelShortsInputSchema,
    outputSchema: YouTubeShortListSchema,
  },
  async (input: any) => {
    console.warn('[fetchChannelShortsFlow] Temporarily disabled to ensure application stability.');
    return [];
  }
);
