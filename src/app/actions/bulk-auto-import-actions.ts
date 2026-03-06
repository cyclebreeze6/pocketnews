'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelVideosFlow } from '../../ai/flows/youtube-channel-videos-flow';
import { saveSyncedVideos } from './save-synced-videos';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';

export interface DiscoveredVideo {
    youtubeVideoId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    channelId: string;
    channelName: string;
    publishedAt?: string;
    regions: string[];
}

/**
 * Step 1: Discovers the single latest video from all active auto-sync channels.
 * Filters out videos that already exist in the database.
 */
export async function discoverLatestVideos(): Promise<DiscoveredVideo[]> {
    if (!isFirebaseAdminInitialized) {
        throw new Error("Admin SDK not initialized.");
    }

    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ onlyAutoSync: true });
    const existingIdsSet = new Set(existingYoutubeIds);
    const discovered: DiscoveredVideo[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;

        try {
            // Use high-efficiency playlist fetch (1 unit)
            const videos = await fetchChannelVideosFlow({ 
                channelUrl: channel.youtubeChannelUrl, 
                channelId: channel.youtubeChannelId,
                maxResults: 1 
            });

            if (videos.length > 0) {
                const latest = videos[0];
                if (!existingIdsSet.has(latest.videoId)) {
                    discovered.push({
                        youtubeVideoId: latest.videoId,
                        title: latest.title,
                        description: latest.description,
                        thumbnailUrl: latest.thumbnailUrl,
                        channelId: channel.id,
                        channelName: channel.name,
                        publishedAt: latest.publishedAt,
                        regions: channel.region || ['Global'],
                    });
                }
            }
        } catch (error: any) {
            console.error(`Discovery failed for ${channel.name}:`, error.message);
        }
    }

    return discovered;
}

/**
 * Step 3: Commits the discovered videos to the database under 'Breaking News'.
 */
export async function commitBulkImport(videos: DiscoveredVideo[]): Promise<{ count: number }> {
    if (videos.length === 0) return { count: 0 };

    const videosToSave = videos.map(v => ({
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        description: v.description,
        thumbnailUrl: v.thumbnailUrl,
        channelId: v.channelId,
        contentCategory: 'Breaking News',
        views: Math.floor(Math.random() * 5000),
        watchTime: Math.floor(Math.random() * 50),
        regions: v.regions,
    }));

    await saveSyncedVideos(videosToSave);
    return { count: videosToSave.length };
}
