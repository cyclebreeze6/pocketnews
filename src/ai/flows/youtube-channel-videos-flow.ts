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
});
export type YouTubeChannelVideosInput = z.infer<typeof YouTubeChannelVideosInputSchema>;

const YouTubeVideoDetailsSchema = z.object({
  videoId: z.string().describe('The unique ID of the YouTube video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
  authorName: z.string().describe("The name of the video's author or channel."),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

const YouTubeVideoListSchema = z.array(YouTubeVideoDetailsSchema);
export type YouTubeVideoList = z.infer<typeof YouTubeVideoListSchema>;


/**
 * Extracts a potential channel identifier (handle, custom name, or ID) from a YouTube URL.
 * @param url The full YouTube channel URL.
 * @returns A string identifier or null if one cannot be found.
 */
function getIdentifierFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p); // e.g., ['@handle'], ['channel', 'UC...'], ['user', 'name']

        if (pathParts.length === 0) return null;
        
        // Handle URLs like /@handle, /c/custom, /user/name, or just /name
        // The last part of the path is usually the identifier.
        const identifier = pathParts[pathParts.length - 1];

        // If it starts with @, remove it for the search query
        return identifier.startsWith('@') ? identifier.substring(1) : identifier;

    } catch (e) {
        console.error("Invalid URL provided to getIdentifierFromUrl", e);
        return null;
    }
}


export const fetchChannelVideosFlow = ai.defineFlow(
  {
    name: 'fetchChannelVideosFlow',
    inputSchema: YouTubeChannelVideosInputSchema,
    outputSchema: YouTubeVideoListSchema,
  },
  async (input) => {
    const youtube = await getYoutubeClient();
    const identifier = getIdentifierFromUrl(input.channelUrl);

    if (!identifier) {
        throw new Error('Could not find a valid identifier in the YouTube URL.');
    }
    
    // Use the search API to reliably find the channel ID from the identifier
    const searchResponse = await youtube.search.list({
        part: ['id'],
        q: identifier,
        type: ['channel'],
        maxResults: 1
    });

    const channelId = searchResponse.data.items?.[0]?.id?.channelId;
    
    if (!channelId) {
        throw new Error(`Could not determine the YouTube Channel ID for "${identifier}". Please make sure the URL is correct.`);
    }
    
    // 1. Get channel details to find the "uploads" playlist ID and author name
    const channelResponse = await youtube.channels.list({
        part: ['contentDetails', 'snippet'],
        id: [channelId],
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
        throw new Error('Could not find channel details after finding ID.');
    }

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
        throw new Error('Could not find the uploads playlist for this channel.');
    }
    
    const authorName = channel.snippet?.title || 'Unknown Channel';

    // 2. Get the most recent videos from the "uploads" playlist
    const playlistResponse = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 15, // Get the 15 most recent videos
    });

    const videos: YouTubeVideoList = [];
    const videoItems = playlistResponse.data.items;

    if (videoItems) {
        for (const item of videoItems) {
            const snippet = item.snippet;
            const videoId = snippet?.resourceId?.videoId;
            
            if (videoId && snippet?.title && snippet?.thumbnails?.high?.url) {
                videos.push({
                    videoId: videoId,
                    title: snippet.title,
                    description: snippet.description || '',
                    authorName: authorName,
                    // Use high-quality thumbnail if available
                    thumbnailUrl: snippet.thumbnails.high.url || snippet.thumbnails.default.url,
                });
            }
        }
    }
    
    return videos;
  }
);
