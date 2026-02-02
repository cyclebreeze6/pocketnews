'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelShorts } from '../actions/youtube-channel-shorts-flow';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { YouTubeShortDetails } from '../../ai/flows/youtube-channel-shorts-flow';
import 'dotenv/config';

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

// The data structure for the UI
export interface NewShortForImport extends YouTubeShortDetails {
    channelId: string;
    channelName: string;
}

// The data to be saved to firestore
export interface ImportedShortSaveData {
    youtubeVideoId: string;
    title: string;
    thumbnailUrl: string;
    channelId: string;
    creatorId: string;
}

export async function fetchNewShortsForBulkImport(): Promise<NewShortForImport[]> {
    const { channelsToSync } = await getChannelsForSync();

    if (channelsToSync.length === 0) {
        return [];
    }

    const firestore = getFirestore(adminApp);
    const shortsCollection = await firestore.collection('shorts').get();
    const existingYoutubeIds = new Set(shortsCollection.docs.map(doc => doc.data().youtubeVideoId));

    const allNewShorts: NewShortForImport[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            const fetchedShorts = await fetchChannelShorts({ channelUrl: channel.youtubeChannelUrl });

            const newShorts = fetchedShorts
                .filter(short => !existingYoutubeIds.has(short.youtubeVideoId))
                .map(short => ({
                    ...short,
                    channelId: channel.id,
                    channelName: channel.name,
                }));
            
            allNewShorts.push(...newShorts);

        } catch (error: any) {
            console.error(`Failed to fetch shorts for channel "${channel.name}":`, error.message);
        }
    }

    return allNewShorts.sort((a,b) => a.title.localeCompare(b.title));
}


export async function saveImportedShorts(shorts: ImportedShortSaveData[]): Promise<void> {
    if (!shorts || shorts.length === 0) {
        return;
    }
    
    const firestore = getFirestore(adminApp);
    const batch = firestore.batch();

    shorts.forEach(short => {
        const docRef = firestore.collection('shorts').doc();
        batch.set(docRef, {
            ...short,
            id: docRef.id,
            createdAt: new Date(),
        });
    });

    await batch.commit();
}
