'use server';

import { getChannelsForSync } from './get-channels-for-sync';
import { fetchChannelShorts } from '../actions/youtube-channel-shorts-flow';
// NOTE: firebase-admin imports removed to ensure server stability.
import type { YouTubeShortDetails } from '../../ai/flows/youtube-channel-shorts-flow';
import 'dotenv/config';


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

/**
 * This function is temporarily disabled and will return an empty array.
 */
export async function fetchNewShortsForBulkImport(): Promise<NewShortForImport[]> {
    console.warn('[fetchNewShortsForBulkImport] Temporarily disabled. Returning empty array.');
    return [];
}

/**
 * This function is temporarily disabled and will not save any data.
 */
export async function saveImportedShorts(shorts: ImportedShortSaveData[]): Promise<void> {
    console.warn('[saveImportedShorts] Temporarily disabled due to server instability. Skipping save.');
    if (!shorts || shorts.length === 0) {
        return;
    }
    // Do nothing.
    return;
}
