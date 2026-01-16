
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
  language: z.string().optional().describe('The default language of the video (e.g., "en", "es").'),
  region: z.string().optional().describe('The location description where the video was recorded.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

const YouTubeVideoListSchema = z.array(YouTubeVideoDetailsSchema);
export type YouTubeVideoList = z.infer<typeof YouTubeVideoListSchema>;


/**
 * Extracts a potential channel identifier (handle, custom name, or ID) from a YouTube URL.
 * This is a more robust implementation.
 * @param url The full YouTube channel URL.
 * @returns A string identifier or null if one cannot be found.
 */
function getIdentifierFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // pathname can be like /c/Google, /channel/ID, /@Google, /Google
        const pathParts = urlObj.pathname.split('/').filter(p => p);

        // Order of checks is important, from most specific to least specific.

        // 1. /channel/UC... (Canonical ID)
        if (pathParts[0] === 'channel' && pathParts[1]?.startsWith('UC')) {
            return pathParts[1];
        }

        // 2. /@handle
        if (pathParts[0]?.startsWith('@')) {
            return pathParts[0];
        }

        // 3. /c/customUrl or /user/legacyUsername
        if ((pathParts[0] === 'c' || pathParts[0] === 'user') && pathParts[1]) {
            return pathParts[1];
        }

        // 4. Fallback for root-level vanity names (e.g., youtube.com/Google)
        // This is the most ambiguous, so it's last.
        // Make sure it's a single path part and doesn't look like another reserved path.
        if (pathParts.length === 1 && !['watch', 'results', 'feed', 'playlist', 'shorts'].includes(pathParts[0])) {
            return pathParts[0];
        }
        
        return null;
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
        throw new Error('Could not find a valid channel identifier in the YouTube URL. Please use a channel URL, not a video URL.');
    }
    
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
    
    const videoIds = videoItems.map(item => item.snippet?.resourceId?.videoId).filter((id): id is string => !!id);

    // Fetch full video details to get language and region
    const videoDetailsResponse = await youtube.videos.list({
        part: ['snippet', 'recordingDetails'],
        id: videoIds,
    });

    const videoDetailsMap = new Map(
      videoDetailsResponse.data.items?.map(item => [item.id!, item]) || []
    );

    const videos: YouTubeVideoList = [];
    for (const item of videoItems) {
        const snippet = item.snippet;
        const videoId = snippet?.resourceId?.videoId;
        
        if (videoId && snippet?.title && snippet?.thumbnails?.high?.url) {
            const details = videoDetailsMap.get(videoId);
            videos.push({
                videoId: videoId,
                title: snippet.title,
                description: snippet.description || '',
                authorName: authorName,
                thumbnailUrl: snippet.thumbnails.high.url || snippet.thumbnails.default?.url || '',
                language: details?.snippet?.defaultLanguage || details?.snippet?.defaultAudioLanguage,
                region: details?.recordingDetails?.locationDescription,
            });
        }
    }
    
    return videos;
  }
);
