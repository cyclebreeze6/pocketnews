
'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelVideosFlow, type YouTubeVideoDetails } from '../../ai/flows/youtube-channel-videos-flow';
import { saveSyncedVideos } from './save-synced-videos';

export interface NewVideoForImport extends Omit<YouTubeVideoDetails, 'videoId' | 'authorName' | 'region'> {
    youtubeVideoId: string;
    channelId: string;
    channelName: string;
    language?: string;
    region?: string[];
}

export interface ImportedVideoSaveData extends NewVideoForImport {
    contentCategory: string;
    views: number;
    watchTime: number;
}


export async function fetchNewVideosForBulkImport(): Promise<NewVideoForImport[]> {
    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync();

    if (channelsToSync.length === 0) {
        return [];
    }

    const existingIdsSet = new Set(existingYoutubeIds);
    const allNewVideos: NewVideoForImport[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl });

            const newVideos = fetchedVideos
                .filter(video => !existingIdsSet.has(video.videoId))
                .map(video => ({
                    youtubeVideoId: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnailUrl: video.thumbnailUrl,
                    channelId: channel.id,
                    channelName: channel.name,
                    language: video.language,
                    region: video.region ? [video.region] : [],
                }));
            
            allNewVideos.push(...newVideos);

        } catch (error: any) {
            console.error(`Failed to fetch videos for channel "${channel.name}":`, error.message);
            // Optionally, we could return errors to the UI. For now, we just skip failed channels.
        }
    }

    // Sort by title to keep a consistent order
    return allNewVideos.sort((a,b) => a.title.localeCompare(b.title));
}

export async function saveImportedVideos(videos: ImportedVideoSaveData[]): Promise<void> {
    if (!videos || videos.length === 0) {
        return;
    }
    // The saveSyncedVideos function is already set up to handle an array of video data.
    await saveSyncedVideos(videos);
}
