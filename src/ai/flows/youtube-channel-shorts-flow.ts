'use server';
/**
 * @fileOverview A flow for fetching recent shorts from a YouTube channel using the YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

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
  async (input) => {
    const youtube = await getYoutubeClient();
    let channelId: string | undefined;

    const trimmedUrl = input.channelUrl.trim();
    // Regex for standard Channel ID (UC..., HC..., KC...)
    const channelIdRegex = /(?:youtube\.com\/channel\/)([\w-]{24})/;
    const match = trimmedUrl.match(channelIdRegex);

    if (match && match[1]) {
        // If we find a standard channel ID, use it directly.
        channelId = match[1];
    } else {
        // For all other URL types (@handle, /c/name, /user/name), use the search API.
        const searchResponse = await youtube.search.list({
            part: ['id'],
            q: trimmedUrl,
            type: ['channel'],
            maxResults: 1
        });
        channelId = searchResponse.data.items?.[0]?.id?.channelId;
    }
    
    if (!channelId) {
        throw new Error(`Could not determine the YouTube Channel ID from the provided URL. Please make sure the URL is correct.`);
    }

    const searchResponse = await youtube.search.list({
        part: ['snippet'],
        channelId: channelId,
        maxResults: input.maxResults,
        order: 'date',
        type: ['video'],
        videoDuration: 'short'
    });

    const videoItems = searchResponse.data.items;
    if (!videoItems || videoItems.length === 0) {
        return [];
    }
    
    const shorts: YouTubeShortList = [];
    for (const item of videoItems) {
        const snippet = item.snippet;
        const videoId = item.id?.videoId;
        
        if (videoId && snippet?.title && snippet?.thumbnails?.high?.url) {
            shorts.push({
                youtubeVideoId: videoId,
                title: snippet.title,
                thumbnailUrl: snippet.thumbnails.high.url || snippet.thumbnails.default?.url || '',
            });
        }
    }
    
    return shorts;
  }
);
