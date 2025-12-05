import { ai } from '../genkit';
import { z } from 'zod';
import { fetchChannelVideosFlow, YouTubeVideoDetailsSchema } from './youtube-channel-videos-flow';
import { getChannelsForSync } from '../../app/actions/get-channels-for-sync';

export const FetchedVideoSchema = YouTubeVideoDetailsSchema;
export type FetchedVideo = z.infer<typeof FetchedVideoSchema>;

export const FetchResultSchema = z.object({
  videos: z.array(FetchedVideoSchema).describe("A list of new videos found across all channels."),
  errors: z.array(z.string()).describe('A list of errors encountered during the sync process.'),
});
export type FetchResult = z.infer<typeof FetchResultSchema>;

export const fetchNewYouTubeVideosFlow = ai.defineFlow(
  {
    name: 'fetchNewYouTubeVideosFlow',
    outputSchema: FetchResultSchema,
  },
  async () => {
    const allNewVideos: FetchedVideo[] = [];
    const errors: string[] = [];

    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();

    if (channelsToSync.length === 0) {
      return { videos: [], errors: ["No channels are configured for syncing. Please add a YouTube Channel URL to one or more channels."] };
    }
    
    const existingIdsSet = new Set(existingYoutubeIds);
    const addedVideoIds = new Set<string>();

    for (const channel of channelsToSync) {
      if (!channel.youtubeChannelUrl) continue;

      try {
        const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });
        
        const newVideos = fetchedVideos.filter(video => !existingIdsSet.has(video.videoId) && !addedVideoIds.has(video.videoId));

        for (const video of newVideos) {
            allNewVideos.push(video);
            addedVideoIds.add(video.videoId);
        }
      } catch (error: any) {
        console.error(`Failed to sync channel "${channel.name}":`, error);
        errors.push(`Failed to sync ${channel.name}: ${error.message || 'Unknown error'}`);
      }
    }

    // Since we fetch 15 from each, we might have more than 10, so we slice.
    return { videos: allNewVideos.slice(0, 10), errors };
  }
);
