'use server';
/**
 * @fileOverview A flow for fetching recent videos from a YouTube channel using the YouTube Data API.
 *
 * - fetchChannelVideosFlow - Fetches a list of recent videos from a given channel URL.
 * - YouTubeChannelVideosInput - The input type for the flow.
 * - YouTubeVideoDetails - The output type for a single video.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelVideosInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
  maxResults: z.number().optional().default(15).describe('The maximum number of videos to fetch.'),
});
export type YouTubeChannelVideosInput = z.infer<typeof YouTubeChannelVideosInputSchema>;

export const YouTubeVideoDetailsSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  authorName: z.string().describe("The name of the video's author or channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

const YouTubeVideoListSchema = z.array(YouTubeVideoDetailsSchema);
export type YouTubeVideoList = z.infer<typeof YouTubeVideoListSchema>;


// Helper to get channel ID from various URL formats.
function getYouTubeChannelIdFromUrl(url: string): string | null {
    // Look for /channel/UC...
    const channelMatch = url.match(/\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch && channelMatch[1]) {
        return channelMatch[1];
    }
    return null;
}

// Helper to get channel handle from URL
function getYouTubeHandleFromUrl(url: string): string | null {
    const handleMatch = url.match(/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch && handleMatch[1]) {
        return handleMatch[1];
    }
    return null;
}

export const fetchChannelVideosFlow = ai.defineFlow(
  {
    name: 'fetchChannelVideosFlow',
    inputSchema: YouTubeChannelVideosInputSchema,
    outputSchema: YouTubeVideoListSchema,
  },
  async ({ channelUrl, maxResults }) => {
    const youtube = await getYoutubeClient();
    
    let channelId: string | null = getYouTubeChannelIdFromUrl(channelUrl);
    
    // If we can't find a channel ID, try to find a handle and look up the ID.
    if (!channelId) {
        const handle = getYouTubeHandleFromUrl(channelUrl);
        if (handle) {
            const channelInfoResponse = await youtube.execute(client => 
                client.channels.list({ part: ['id'], forHandle: handle })
            );
            channelId = channelInfoResponse.data.items?.[0]?.id || null;
        }
    }

    if (!channelId) {
      throw new Error('Could not determine YouTube Channel ID or Handle from the provided URL.');
    }

    const response = await youtube.execute(client =>
      client.search.list({
        part: ['snippet'],
        channelId: channelId as string,
        maxResults: maxResults,
        order: 'date',
        type: ['video'],
      })
    );

    const videos: YouTubeVideoDetails[] = [];
    if (response.data.items) {
      for (const item of response.data.items) {
        if (item.id?.videoId && item.snippet) {
          videos.push({
            videoId: item.id.videoId,
            title: item.snippet.title || 'Untitled',
            description: item.snippet.description || '',
            authorName: item.snippet.channelTitle || '',
            thumbnailUrl: item.snippet.thumbnails?.high?.url || '',
          });
        }
      }
    }
    return videos;
  }
);
