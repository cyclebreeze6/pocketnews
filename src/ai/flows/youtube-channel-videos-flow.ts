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

async function getChannelIdFromUrl(url: string): Promise<string | null> {
    const youtube = await getYoutubeClient();
    const urlParts = url.split('/').filter(p => p);
    const lastPart = urlParts[urlParts.length - 1];

    if (url.includes('/channel/')) {
        return lastPart;
    } 
    
    // For handles like /@MrBeast or legacy /c/MrBeast
    if (url.includes('/@') || url.includes('/c/')) {
       try {
         const searchResponse = await youtube.search.list({
             part: ['id'],
             q: lastPart,
             type: ['channel'],
             maxResults: 1
         });
         // The search can be imprecise, so we need to be careful.
         // A better approach would be a direct lookup if the API supported it for handles.
         return searchResponse.data.items?.[0]?.id?.channelId || null;
       } catch (e) {
          console.error("Failed to resolve channel handle", e);
          // Try a different method for handles starting with @
          if(lastPart.startsWith('@')) {
             try {
                const searchResponse = await youtube.channels.list({
                    part: ['id'],
                    forUsername: lastPart.substring(1),
                });
                return searchResponse.data.items?.[0]?.id || null;
             } catch (e2) {
                console.error("Failed to resolve channel username", e2);
                return null;
             }
          }
          return null;
       }
    }
    
    // Fallback for user-provided vanity names like /user/MrBeast
    try {
        const username = lastPart;
        const channelResponse = await youtube.channels.list({
            part: ['id'],
            forUsername: username
        });
        return channelResponse.data.items?.[0]?.id || null;
    } catch (e) {
        console.error('Failed to resolve username URL', e);
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
    const channelId = await getChannelIdFromUrl(input.channelUrl);

    if (!channelId) {
        throw new Error('Could not determine the YouTube Channel ID from the URL. Please make sure the URL is correct and points to a channel homepage.');
    }
    
    // 1. Get channel details to find the "uploads" playlist ID
    const channelResponse = await youtube.channels.list({
        part: ['contentDetails', 'snippet'],
        id: [channelId],
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
        throw new Error('Could not find channel details.');
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
