
'use server';

import type { youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

/**
 * THIS FEATURE IS TEMPORARILY DISABLED TO ENSURE APPLICATION STABILITY.
 * The YouTube client has been deactivated.
 */
async function executeWithRotation(
    apiCall: (youtubeClient: youtube_v3.Youtube) => Promise<any>,
    keys: string[],
    keyIndex: number
): Promise<any> {
    throw new Error('The YouTube API client is temporarily disabled.');
}

export async function getYoutubeClient() {
    throw new Error('The YouTube API client is temporarily disabled.');
}
