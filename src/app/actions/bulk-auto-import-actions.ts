'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelVideos } from '../../ai/flows/youtube-channel-videos-flow';
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
 * Unified 1-step action: Discovers and commits new videos.
 */
export async function syncAllChannelsAction(): Promise<{ count: number, synced: number }> {
    if (!isFirebaseAdminInitialized) {
        throw new Error("Admin SDK not initialized.");
    }

    const { channelsToSync, existingYoutubeIds } = await getChannelsForSync({ onlyAutoSync: true });
    const existingIdsSet = new Set(existingYoutubeIds);
    const videosToSave: any[] = [];
    let syncedCount = 0;

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;

        try {
            const videos = await fetchChannelVideos({ 
                channelUrl: channel.youtubeChannelUrl, 
                channelId: channel.youtubeChannelId,
                maxResults: 1 
            });

            if (videos.length > 0) {
                const latest = videos[0];
                if (!existingIdsSet.has(latest.videoId)) {
                    videosToSave.push({
                        youtubeVideoId: latest.videoId,
                        title: latest.title,
                        description: latest.description,
                        thumbnailUrl: latest.thumbnailUrl,
                        channelId: channel.id,
                        contentCategory: 'Breaking News',
                        views: Math.floor(Math.random() * 5000),
                        watchTime: Math.floor(Math.random() * 50),
                        regions: channel.region || ['Global'],
                    });
                }
            }
            syncedCount++;
        } catch (error: any) {
            console.error(`Sync failed for ${channel.name}:`, error.message);
        }
    }

    if (videosToSave.length > 0) {
        await saveSyncedVideos(videosToSave);
    }

    return { count: videosToSave.length, synced: syncedCount };
}
