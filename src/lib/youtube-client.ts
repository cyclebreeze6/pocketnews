
'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

/**
 * Executes a YouTube API request with automatic API key rotation on quota errors.
 *
 * @param apiCall - A function that takes a fresh YouTube API client and executes the desired call.
 * @param keys - An array of API keys to try.
 * @param keyIndex - The index of the current key to use from the array.
 * @returns The result of the API call.
 * @throws An error if all API keys are exhausted or a non-quota error occurs.
 */
async function executeWithRotation(
    apiCall: (youtubeClient: youtube_v3.Youtube) => Promise<any>,
    keys: string[],
    keyIndex: number
): Promise<any> {
    if (keyIndex >= keys.length) {
        throw new Error('All available YouTube API keys have exceeded their quota.');
    }

    const apiKey = keys[keyIndex];
    if (!apiKey) {
         // This case should ideally not be hit if the keys array is filtered for empty strings.
        throw new Error('Encountered an empty API key.');
    }
    
    // Create a new client for each attempt with the current active key.
    const youtubeClient = google.youtube({
        version: 'v3',
        auth: apiKey,
    });
    
    try {
        // Attempt the API call.
        return await apiCall(youtubeClient);
    } catch (error: any) {
        // Check if the error is a quota error.
        const isQuotaError = error.errors?.some((e: any) => e.reason === 'quotaExceeded') || (error.message && error.message.includes('quota'));

        if (isQuotaError) {
            console.warn(`[YouTube Client] Quota exceeded for API key at index ${keyIndex}. Rotating to the next key...`);
            // Retry the call with the next key.
            return executeWithRotation(apiCall, keys, keyIndex + 1);
        } else {
            // If it's not a quota error, re-throw it immediately.
            console.error('[YouTube Client] A non-quota API error occurred:', error.message);
            if (error.response?.data?.error?.message) {
                 throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
            }
            throw new Error(error.message || 'An unknown YouTube API error occurred.');
        }
    }
}

/**
 * Creates and returns an object that acts as a proxy to the YouTube API,
 * with each method call wrapped in the automatic key rotation logic.
 *
 * @returns A YouTube client-like object.
 */
export async function getYoutubeClient() {
    const keys = await getApiKeys();
    if (!keys || keys.length === 0) {
        throw new Error('No YouTube API Key is configured. Please add one in Admin > Settings.');
    }

    // This object mimics the structure of the googleapis youtube client.
    // Each function we need is wrapped with the rotation logic.
    return {
        search: {
            list: (params: youtube_v3.Params$Resource$Search$List) => 
                executeWithRotation(client => client.search.list(params), keys, 0)
        },
        channels: {
            list: (params: youtube_v3.Params$Resource$Channels$List) => 
                executeWithRotation(client => client.channels.list(params), keys, 0)
        },
        playlistItems: {
            list: (params: youtube_v3.Params$Resource$Playlistitems$List) =>
                executeWithRotation(client => client.playlistItems.list(params), keys, 0)
        },
        videos: {
            list: (params: youtube_v3.Params$Resource$Videos$List) =>
                executeWithRotation(client => client.videos.list(params), keys, 0)
        }
    };
}
