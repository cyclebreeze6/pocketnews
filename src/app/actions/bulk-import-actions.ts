
'use server';

import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { fetchChannelVideosFlow } from '../../ai/flows/youtube-channel-videos-flow';
import { saveSyncedVideos } from './save-synced-videos';
import type { Channel } from '../../lib/types';

interface ImportResult {
    importedCount: number;
    errors: string[];
}

export async function importLatestVideoFromChannels(channelIds: string[]): Promise<ImportResult> {
    if (!isFirebaseAdminInitialized) {
        throw new Error("Cannot import videos: Admin SDK not configured.");
    }
    if (!channelIds || channelIds.length === 0) {
        return { importedCount: 0, errors: ["No channels were selected."] };
    }

    const firestore = adminSDK.firestore();

    const videosSnapshot = await firestore.collection('videos').get();
    const existingYoutubeIds = new Set(videosSnapshot.docs.map(doc => doc.data().youtubeVideoId));

    const channelsRef = firestore.collection('channels');
    const channelsSnapshot = await channelsRef.where(adminSDK.firestore.FieldPath.documentId(), 'in', channelIds).get();
    const selectedChannels = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));

    const videosToSave = [];
    const errors: string[] = [];

    for (const channel of selectedChannels) {
        if (!channel.youtubeChannelUrl) {
            errors.push(`Channel "${channel.name}" has no YouTube URL configured.`);
            continue;
        }

        try {
            const fetchedVideos = await fetchChannelVideosFlow({ channelUrl: channel.youtubeChannelUrl, maxResults: 1 });

            if (fetchedVideos.length > 0) {
                const latestVideo = fetchedVideos[0];
                
                if (!existingYoutubeIds.has(latestVideo.videoId)) {
                    videosToSave.push({
                        youtubeVideoId: latestVideo.videoId,
                        title: latestVideo.title,
                        description: latestVideo.description,
                        thumbnailUrl: latestVideo.thumbnailUrl,
                        channelId: channel.id,
                        contentCategory: 'News', // Default category for bulk import
                        views: Math.floor(Math.random() * 1000),
                        watchTime: Math.floor(Math.random() * 100),
                    });
                    existingYoutubeIds.add(latestVideo.videoId);
                }
            }
        } catch (error: any) {
            console.error(`Failed to fetch video for channel "${channel.name}":`, error.message);
            errors.push(`Channel "${channel.name}": ${error.message}`);
        }
    }

    if (videosToSave.length > 0) {
        await saveSyncedVideos(videosToSave);
    }

    return {
        importedCount: videosToSave.length,
        errors,
    };
}
