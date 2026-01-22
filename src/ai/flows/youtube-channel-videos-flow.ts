
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


export const fetchChannelVideosFlow = ai.defineFlow(
  {
    name: 'fetchChannelVideosFlow',
    inputSchema: YouTubeChannelVideosInputSchema,
    outputSchema: YouTubeVideoListSchema,
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

    const playlistResponse = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 15,
    });

    const videoItems = playlistResponse.data.items;
    if (!videoItems || videoItems.length === 0) {
        return [];
    }
    
    const videos: YouTubeVideoList = [];
    for (const item of videoItems) {
        const snippet = item.snippet;
        const videoId = snippet?.resourceId?.videoId;
        
        if (videoId && snippet?.title && snippet?.thumbnails?.high?.url) {
            videos.push({
                videoId: videoId,
                title: snippet.title,
                description: snippet.description || '',
                authorName: authorName,
                thumbnailUrl: snippet.thumbnails.high.url || snippet.thumbnails.default?.url || '',
            });
        }
    }
    
    return videos;
  }
);

    