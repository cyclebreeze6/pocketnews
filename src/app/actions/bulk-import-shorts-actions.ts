'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelShorts } from '../actions/youtube-channel-shorts-flow';
import type { YouTubeShortDetails } from '../../ai/flows/youtube-channel-shorts-flow';
import { initializeFirebase } from '../../firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { adminSDK, isFirebaseAdminInitialized } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';


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

    const { firestore } = initializeFirebase();
    const shortsCollection = await getDocs(collection(firestore, 'shorts'));
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
    
    if (!isFirebaseAdminInitialized) {
        throw new Error("Cannot save shorts: Admin SDK not configured.");
    }
    
    const firestore = adminSDK.firestore();
    const batch = firestore.batch();
    const shortsCollection = firestore.collection('shorts');

    shorts.forEach(short => {
        const docRef = shortsCollection.doc();
        batch.set(docRef, {
            ...short,
            id: docRef.id,
            createdAt: FieldValue.serverTimestamp(),
        });
    });

    await batch.commit();
}
