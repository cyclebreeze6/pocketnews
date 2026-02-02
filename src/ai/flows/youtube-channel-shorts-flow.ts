'use server';
/**
 * @fileOverview A flow for fetching recent shorts from a YouTube channel using the YouTube Data API.
 */
import { ai } from '../genkit';
import { z } from 'genkit';
import { getYoutubeClient } from '../../lib/youtube-client';

const YouTubeChannelShortsInputSchema = z.object({
  channelUrl: z.string().url().describe('The URL of the YouTube channel.'),
  maxResults: z.number().optional().default(25).describe('The maximum number of shorts to fetch.'),
});
export type YouTubeChannelShortsInput = z.infer<typeof YouTubeChannelShortsInputSchema>;

export const YouTubeShortDetailsSchema = z.object({
  youtubeVideoId: z.string().describe('The unique ID of the YouTube short.'),
  title: z.string().describe('The title of the short.'),
  thumbnailUrl: z.string().url().describe('The URL for the short thumbnail.'),
});
export type YouTubeShortDetails = z.infer<typeof YouTubeShortDetailsSchema>;

const YouTubeShortListSchema = z.array(YouTubeShortDetailsSchema);
export type YouTubeShortList = z.infer<typeof YouTubeShortListSchema>;

function getYouTubeChannelId(url: string): string | null {
    const regExp = /^.*(youtube.com\/channel\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2]) ? match[2] : null;
}

export const fetchChannelShortsFlow = ai.defineFlow(
  {
    name: 'fetchChannelShortsFlow',
    inputSchema: YouTubeChannelShortsInputSchema,
    outputSchema: YouTubeShortListSchema,
  },
  async ({ channelUrl, maxResults }) => {
    const channelId = getYouTubeChannelId(channelUrl);
    if (!channelId) {
      throw new Error('Could not extract a valid YouTube Channel ID from the URL. Please use the format .../channel/UC...');
    }

    const youtube = await getYoutubeClient();
    const response = await youtube.execute(client =>
      client.search.list({
        part: ['snippet'],
        channelId: channelId,
        maxResults: maxResults,
        order: 'date',
        type: ['video'],
        q: '#shorts', // A common way to find shorts
      })
    );

    const shorts: YouTubeShortDetails[] = [];
    if (response.data.items) {
      for (const item of response.data.items) {
        if (item.id?.videoId && item.snippet?.title && item.snippet?.thumbnails?.high?.url) {
          // Additional check: Shorts often have 'short' in the title or a very short duration.
          // The YouTube API doesn't have a perfect flag for this in search results, so we'll rely on the query.
          shorts.push({
            youtubeVideoId: item.id.videoId,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails.high.url,
          });
        }
      }
    }
    return shorts;
  }
);
