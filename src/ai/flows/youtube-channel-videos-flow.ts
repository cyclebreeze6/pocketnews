/**
 * @fileOverview Utility for fetching recent videos from a YouTube channel using the YouTube Data API.
 * Uses the PlaylistItems method which is significantly cheaper (1 unit) than Search (100 units).
 */

import { getYoutubeClient } from '../../lib/youtube-client';
import { z } from 'zod';

export const YouTubeVideoDetailsSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  authorName: z.string().describe("The name of the video's author or channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
  publishedAt: z.string().optional().describe('ISO date string of publication.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

export type YouTubeVideoList = YouTubeVideoDetails[];

function extractChannelIdFromUrl(url: string): string | null {
    const match = url.match(/channel\/([a-zA-Z0-9_-]{24})/);
    return match ? match[1] : null;
}

async function resolveChannelIdAndPlaylist(channelUrl: string, knownId?: string): Promise<{ channelId: string, uploadsPlaylistId: string }> {
    const client = await getYoutubeClient();
    let channelId = knownId || extractChannelIdFromUrl(channelUrl);

    // If we don't have an ID, we need to find it via handle or search
    if (!channelId) {
        let handleMatch = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
        let query = handleMatch ? handleMatch[1] : channelUrl;

        const searchResponse = await client.execute(y => y.search.list({
            part: ['snippet'],
            q: query,
            type: ['channel'],
            maxResults: 1
        }));
        
        channelId = searchResponse.data.items?.[0]?.snippet?.channelId || null;
    }

    if (!channelId) {
        throw new Error('Could not resolve a valid YouTube Channel ID from the URL.');
    }

    // Now get the uploads playlist ID (this is the most efficient way to get videos)
    const channelResponse = await client.execute(y => y.channels.list({
        part: ['contentDetails', 'snippet'],
        id: [channelId!]
    }));

    const channel = channelResponse.data.items?.[0];
    const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
        throw new Error('Could not find the uploads playlist for this channel.');
    }

    return { channelId: channelId!, uploadsPlaylistId };
}

/**
 * Fetches recent videos from a channel. This is a standard async function to avoid Genkit metadata overhead.
 */
export async function fetchChannelVideos(input: { channelUrl: string, channelId?: string, maxResults?: number }): Promise<YouTubeVideoList> {
    const { channelUrl, channelId, maxResults = 15 } = input;
    try {
        const client = await getYoutubeClient();
        const { uploadsPlaylistId } = await resolveChannelIdAndPlaylist(channelUrl, channelId);

        // Fetch videos from the uploads playlist (Cost: 1 unit)
        const response = await client.execute(y => y.playlistItems.list({
            part: ['snippet', 'contentDetails'],
            playlistId: uploadsPlaylistId,
            maxResults: maxResults
        }));

        if (!response.data.items) return [];

        return response.data.items.map(item => ({
            videoId: item.contentDetails?.videoId || '',
            title: item.snippet?.title || 'Untitled Video',
            description: item.snippet?.description || '',
            authorName: item.snippet?.channelTitle || '',
            thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
            publishedAt: item.snippet?.publishedAt || '',
        })).filter(v => !!v.videoId);

    } catch (error: any) {
        console.error("API Video Fetch failed:", error.message);
        throw error;
    }
}
