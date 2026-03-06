/**
 * @fileOverview A flow for fetching recent videos from a YouTube channel using the YouTube RSS Feed.
 * This method bypasses API quota limits for video discovery.
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
  publishedAt: z.string().optional().describe('ISO date string of publication.'),
});
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;

const YouTubeVideoListSchema = z.array(YouTubeVideoDetailsSchema);
export type YouTubeVideoList = z.infer<typeof YouTubeVideoListSchema>;

async function getChannelIdFromUrl(youtube: (apiCall: any) => Promise<any>, channelUrl: string): Promise<string> {
    // Check if the URL already contains the ID
    let match = channelUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Try handle
    match = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) {
        const handle = match[1];
        const searchResponse = await youtube((client: any) => client.search.list({
            part: ['snippet'],
            q: handle,
            type: ['channel'],
            maxResults: 1
        }));
        const foundChannelId = searchResponse.data.items?.[0]?.snippet?.channelId;
        if (foundChannelId) return foundChannelId;
    }
    
    // Fallback to searching the whole string
    const searchFallback = await youtube((client: any) => client.search.list({
        part: ['snippet'],
        q: channelUrl,
        type: ['channel'],
        maxResults: 1
    }));
    const fallbackId = searchFallback.data.items?.[0]?.snippet?.channelId;
    if (fallbackId) return fallbackId;

    throw new Error('Could not resolve a valid YouTube Channel ID from the provided URL.');
}

/**
 * Fetches videos via the YouTube RSS feed.
 * This does not use any YouTube Data API quota.
 */
async function fetchVideosViaRss(channelId: string): Promise<YouTubeVideoList> {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    try {
        const response = await fetch(feedUrl);
        const xml = await response.text();

        // Simple XML parsing using regex to avoid heavy dependencies
        const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        return entries.map(entry => {
            const videoId = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/)?.[1] || '';
            const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Untitled';
            const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || '';
            const authorName = entry.match(/<name>([\s\S]*?)<\/name>/)?.[1] || '';
            const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            const publishedAt = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1] || '';

            return {
                videoId,
                title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
                description: description.replace(/<!\[CDATA\[|\]\]>/g, ''),
                authorName,
                thumbnailUrl,
                publishedAt
            };
        }).filter(v => !!v.videoId);
    } catch (error) {
        console.error(`RSS fetch failed for ${channelId}:`, error);
        return [];
    }
}

export const fetchChannelVideosFlow = ai.defineFlow(
  {
    name: 'fetchChannelVideosFlow',
    inputSchema: YouTubeChannelVideosInputSchema,
    outputSchema: YouTubeVideoListSchema,
  },
  async ({ channelUrl, maxResults }) => {
    const youtube = await (await getYoutubeClient()).execute;
    const channelId = await getChannelIdFromUrl(youtube, channelUrl);

    // Prefer RSS discovery to save quota
    const rssVideos = await fetchVideosViaRss(channelId);
    
    if (rssVideos.length > 0) {
        return rssVideos.slice(0, maxResults);
    }

    // Fallback to API if RSS fails
    const response = await youtube(client => client.search.list({
        part: ['snippet'],
        channelId: channelId,
        maxResults: maxResults,
        order: 'date',
        type: ['video'],
    }));

    if (!response.data.items) {
      return [];
    }

    return response.data.items.map(item => ({
      videoId: item.id?.videoId || '',
      title: item.snippet?.title || 'Untitled Video',
      description: item.snippet?.description || '',
      authorName: item.snippet?.channelTitle || '',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
      publishedAt: item.snippet?.publishedAt || '',
    })).filter(v => !!v.videoId);
  }
);
