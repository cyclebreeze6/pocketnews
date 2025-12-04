'use server';
/**
 * @fileOverview A flow for fetching recent videos from a YouTube channel.
 *
 * - fetchChannelVideos - Fetches a list of recent videos from a given channel URL.
 * - YouTubeChannelVideosInput - The input type for the flow.
 * - YouTubeVideoDetails - The output type for a single video.
 */

import { ai } from '../genkit';
import { z } from 'genkit';

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


export async function fetchChannelVideos(input: YouTubeChannelVideosInput): Promise<YouTubeVideoList> {
  return fetchChannelVideosFlow(input);
}


async function getChannelIdFromUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) return null;
        const html = await response.text();
        const channelIdMatch = html.match(/"channelId":"(UC[\w-]{22})"/);
        return channelIdMatch ? channelIdMatch[1] : null;
    } catch (error) {
        console.error('Error fetching channel page:', error);
        return null;
    }
}

const fetchChannelVideosFlow = ai.defineFlow(
  {
    name: 'fetchChannelVideosFlow',
    inputSchema: YouTubeChannelVideosInputSchema,
    outputSchema: YouTubeVideoListSchema,
  },
  async (input) => {
    
    const channelId = await getChannelIdFromUrl(input.channelUrl);

    if (!channelId) {
        throw new Error('Could not automatically determine the YouTube Channel ID from the URL.');
    }
    
    // Using a public RSS feed to avoid needing an API key.
    // This is a workaround and might be less reliable than the official API.
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const response = await fetch(feedUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch YouTube channel feed. Status: ${response.status}`);
    }
    const xmlText = await response.text();

    // Basic XML parsing with regex. A more robust solution would use an XML parser library.
    const entries = xmlText.split('<entry>').slice(1);
    const videos: YouTubeVideoList = [];

    for (const entry of entries) {
        const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const authorNameMatch = entry.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/s);
        const thumbnailMatch = entry.match(/<media:thumbnail.*?url='(.*?)'/);

        if (videoIdMatch && titleMatch && authorNameMatch && thumbnailMatch) {
            videos.push({
                videoId: videoIdMatch[1],
                title: titleMatch[1],
                description: '', // RSS feed doesn't provide a good description
                authorName: authorNameMatch[1],
                thumbnailUrl: thumbnailMatch[1],
            });
        }
    }
    
    return videos.slice(0, 15); // Return up to 15 most recent videos
  }
);
