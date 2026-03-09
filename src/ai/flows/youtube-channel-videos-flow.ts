
/**
 * @fileOverview High-efficiency utility for fetching recent videos from a YouTube channel.
 * Uses the PlaylistItems trick (1 unit cost) and features an RSS failsafe.
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

/**
 * Derives the uploads playlist ID from a channel ID without an API call.
 * This is a documented (though unofficial) YouTube pattern: replace 'UC' with 'UU'.
 */
function getUploadsPlaylistId(channelId: string): string {
    if (channelId.startsWith('UC')) {
        return 'UU' + channelId.substring(2);
    }
    return channelId;
}

/**
 * Failsafe: Fetches the latest videos via YouTube's RSS feed (Zero Quota Cost).
 */
async function fetchViaRSS(channelId: string): Promise<YouTubeVideoList> {
    console.log(`[Sync] API Quota likely exhausted. Falling back to RSS for ${channelId}...`);
    try {
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const res = await fetch(url, { next: { revalidate: 0 } });
        if (!res.ok) throw new Error('RSS Feed unavailable');
        
        const xml = await res.text();
        // Robust regex extraction for Atom feed
        const entries = xml.split('<entry>').slice(1, 11); // Last 10 videos
        
        return entries.map(entry => {
            const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '';
            const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || 'Untitled Video';
            const author = entry.match(/<name>([^<]+)<\/name>/)?.[1] || 'Unknown';
            const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || '';
            
            return {
                videoId,
                title,
                description: 'Fetched via RSS failsafe.',
                authorName: author,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                publishedAt: published,
            };
        }).filter(v => !!v.videoId);
    } catch (e) {
        console.error("[Sync] RSS Fallback failed:", e);
        return [];
    }
}

/**
 * Resolves a channel handle to an ID (Costs 100 units).
 */
async function resolveChannelId(channelUrl: string): Promise<string | null> {
    const handleMatch = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
    if (!handleMatch) return null;

    try {
        const client = await getYoutubeClient();
        const res = await client.execute(y => y.search.list({
            part: ['snippet'],
            q: handleMatch[1],
            type: ['channel'],
            maxResults: 1
        }));
        return res.data.items?.[0]?.snippet?.channelId || null;
    } catch {
        return null;
    }
}

/**
 * Fetches recent videos from a channel using the most quota-efficient method possible.
 */
export async function fetchChannelVideos(input: { channelUrl: string, channelId?: string, maxResults?: number }): Promise<YouTubeVideoList> {
    const { channelUrl, maxResults = 5 } = input;
    let channelId = input.channelId;

    // 1. Ensure we have an ID
    if (!channelId) {
        const match = channelUrl.match(/channel\/([a-zA-Z0-9_-]{24})/);
        channelId = match ? match[1] : await resolveChannelId(channelUrl) || undefined;
    }

    if (!channelId) {
        throw new Error('Could not determine Channel ID for ' + channelUrl);
    }

    try {
        const client = await getYoutubeClient();
        const uploadsPlaylistId = getUploadsPlaylistId(channelId);

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
        // If API fails due to quota, use the RSS failsafe
        if (error.message?.toLowerCase().includes('quota')) {
            return await fetchViaRSS(channelId);
        }
        throw error;
    }
}
