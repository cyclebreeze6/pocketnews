'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelShorts } from './youtube-channel-shorts-flow';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { Short } from '../../lib/types';
import type { YouTubeShortDetails } from '../../ai/flows/youtube-channel-shorts-flow';
import 'dotenv/config';


// This is a helper to init firebase-admin
async function initializeAdmin() {
    if (getApps().length > 0) return;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({ credential: cert(serviceAccount) });
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON. Falling back.", e);
            initializeApp();
        }
    } else {
        initializeApp();
    }
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

async function getExistingShortIds(): Promise<string[]> {
    await initializeAdmin();
    const firestore = getFirestore();
    const shortsSnapshot = await firestore.collection('shorts').get();
    return shortsSnapshot.docs.map(doc => doc.data().youtubeVideoId);
}

export async function fetchNewShortsForBulkImport(): Promise<NewShortForImport[]> {
    const { channelsToSync } = await getChannelsForSync(); // This already inits admin
    const existingShortIds = await getExistingShortIds();

    if (channelsToSync.length === 0) {
        return [];
    }

    const existingIdsSet = new Set(existingShortIds);
    const allNewShorts: NewShortForImport[] = [];

    for (const channel of channelsToSync) {
        if (!channel.youtubeChannelUrl) continue;
        
        try {
            const fetchedShorts = await fetchChannelShorts({ channelUrl: channel.youtubeChannelUrl, maxResults: 25 });

            const newShorts = fetchedShorts
                .filter(short => !existingIdsSet.has(short.youtubeVideoId))
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
    await initializeAdmin();
    
    if (!shorts || shorts.length === 0) {
        return;
    }

    const firestore = getFirestore();
    const batch = firestore.batch();
    const shortsCollectionRef = firestore.collection('shorts');

    shorts.forEach(shortData => {
        const newDocRef = shortsCollectionRef.doc();
        const shortDoc: Partial<Short> = {
            id: newDocRef.id,
            ...shortData,
            createdAt: serverTimestamp(),
        };
        batch.set(newDocRef, shortDoc);
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error committing shorts batch:", error);
        throw new Error('Failed to save new shorts to the database.');
    }
}
