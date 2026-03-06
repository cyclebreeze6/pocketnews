/**
 * @fileOverview A flow for fetching recent videos from a YouTube channel using the YouTube RSS Feed.
 * This method bypasses API quota limits for video discovery.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelVideosInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
  channelId: z.string().optional().describe('The resolved YouTube Channel ID, if already known.'),
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

function extractChannelIdFromUrl(url: string): string | null {
    // Matches youtube.com/channel/UC...
    const match = url.match(/channel\/([a-zA-Z0-9_-]{24})/);
    return match ? match[1] : null;
}

async function resolveChannelId(channelUrl: string): Promise<string> {
    // Try regex extraction first (FREE, no API key needed)
    const extractedId = extractChannelIdFromUrl(channelUrl);
    if (extractedId) return extractedId;

    // Need API for handles/users (@handle or user/name)
    try {
        const client = await getYoutubeClient();
        
        let match = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
        if (match) {
            const handle = match[1];
            const searchResponse = await client.execute(y => y.search.list({
                part: ['snippet'],
                q: handle,
                type: ['channel'],
                maxResults: 1
            }));
            const found = searchResponse.data.items?.[0]?.snippet?.channelId;
            if (found) return found;
        }
        
        const searchFallback = await client.execute(y => y.search.list({
            part: ['snippet'],
            q: channelUrl,
            type: ['channel'],
            maxResults: 1
        }));
        const fallbackId = searchFallback.data.items?.[0]?.snippet?.channelId;
        if (fallbackId) return fallbackId;
    } catch (e) {
        console.warn("Could not resolve Channel ID via API. RSS sync might fail for handles.");
    }

    throw new Error('Could not resolve a valid YouTube Channel ID. Please use a full /channel/UC... URL if API keys are missing.');
}

/**
 * Fetches videos via the YouTube RSS feed.
 * This does not use any YouTube Data API quota.
 */
async function fetchVideosViaRss(channelId: string): Promise<YouTubeVideoList> {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    try {
        const response = await fetch(feedUrl);
        if (!response.ok) return [];
        const xml = await response.text();

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
                title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
                description: description.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
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
  async ({ channelUrl, channelId, maxResults }) => {
    let resolvedId = channelId;

    if (!resolvedId) {
        resolvedId = await resolveChannelId(channelUrl);
    }

    // Attempt RSS discovery first (Free)
    const rssVideos = await fetchVideosViaRss(resolvedId);
    
    if (rssVideos.length > 0) {
        return rssVideos.slice(0, maxResults);
    }

    // Fallback to API if RSS yields nothing (Requires API key)
    try {
        const client = await getYoutubeClient();
        const response = await client.execute(clientApi => clientApi.search.list({
            part: ['snippet'],
            channelId: resolvedId,
            maxResults: maxResults,
            order: 'date',
            type: ['video'],
        }));

        if (!response.data.items) return [];

        return response.data.items.map(item => ({
            videoId: item.id?.videoId || '',
            title: item.snippet?.title || 'Untitled Video',
            description: item.snippet?.description || '',
            authorName: item.snippet?.channelTitle || '',
            thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
            publishedAt: item.snippet?.publishedAt || '',
        })).filter(v => !!v.videoId);
    } catch (apiError) {
        console.warn("RSS and API fallback both failed for channel discovery.", apiError);
        return [];
    }
  }
);
