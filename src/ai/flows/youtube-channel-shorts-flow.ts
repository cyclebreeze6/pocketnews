
/**
 * @fileOverview Standard utility for fetching recent shorts from a YouTube channel using the YouTube Data API.
 * Converted to standard async function to avoid Genkit metadata authentication errors.
 */
import { getYoutubeClient } from '../../lib/youtube-client';
import { z } from 'zod';

export const YouTubeShortDetailsSchema = z.object({
  youtubeVideoId: z.string().describe('The unique ID of the YouTube short.'),
  title: z.string().describe('The title of the short.'),
  thumbnailUrl: z.string().url().describe('The URL for the short thumbnail.'),
});
export type YouTubeShortDetails = z.infer<typeof YouTubeShortDetailsSchema>;

export type YouTubeShortList = YouTubeShortDetails[];

/**
 * Robustly extracts a YouTube Channel ID (UC...) from a URL string.
 */
function extractChannelIdFromUrl(url: string): string | null {
    // 1. Try strict /channel/ path
    let match = url.match(/\/channel\/(UC[a-zA-Z0-9\-_]{22})/);
    if (match) return match[1];

    // 2. Try loose extraction: look for any UC string that is 24 chars long
    match = url.match(/(UC[a-zA-Z0-9\-_]{22})(?![a-zA-Z0-9\-_])/);
    if (match) return match[1];

    return null;
}

async function getChannelIdFromUrl(youtube: (apiCall: any) => Promise<any>, channelUrl: string): Promise<string> {
    // 1. Try regex extraction first
    const extractedId = extractChannelIdFromUrl(channelUrl);
    if (extractedId) return extractedId;

    // 2. Try handle search
    let match = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) {
        const handle = match[1].split('/')[0];
        const searchResponse = await youtube((client: any) => client.search.list({ part: ['snippet'], q: handle, type: ['channel'], maxResults: 1 }));
        const foundId = searchResponse.data.items?.[0]?.snippet?.channelId;
        if (foundId) return foundId;
    }
    
    // 3. Try legacy username
    match = channelUrl.match(/user\/([a-zA-Z0-9_-]+)/);
    if (match) {
         const username = match[1];
         const channelsResponse = await youtube((client: any) => client.channels.list({ part: ['id'], forUsername: username }));
         const foundId = channelsResponse.data.items?.[0]?.id;
         if (foundId) return foundId;
    }

    throw new Error('Could not resolve YouTube Channel ID from URL.');
}

/**
 * Fetches recent shorts from a channel. This is a standard async function to avoid Genkit metadata overhead.
 */
export async function fetchChannelShorts(input: { channelUrl: string, maxResults?: number }): Promise<YouTubeShortList> {
    const { channelUrl, maxResults = 25 } = input;
    try {
        const youtube = await (await getYoutubeClient()).execute;
        const channelId = await getChannelIdFromUrl(youtube, channelUrl);

        const response = await youtube(client => client.search.list({
            part: ['snippet'],
            channelId: channelId,
            maxResults: maxResults,
            order: 'date',
            type: ['video'],
            videoDuration: 'short',
        }));

        if (!response.data.items) {
            return [];
        }

        const shorts: YouTubeShortDetails[] = response.data.items.map(item => ({
            youtubeVideoId: item.id?.videoId || '',
            title: item.snippet?.title || 'Untitled Short',
            thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
        }));

        return shorts.filter(short => !!short.youtubeVideoId);
    } catch (error: any) {
        console.error("API Shorts Fetch failed:", error.message);
        throw error;
    }
}
