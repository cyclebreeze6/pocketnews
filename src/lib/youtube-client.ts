
'use server';

import { google, youtube_v3 } from 'googleapis';
import { getActiveApiKey, rotateApiKey } from '../app/actions/api-key-actions';

// This is the new, more robust implementation of the YouTube client with API key rotation.

/**
 * Executes a YouTube API request with automatic API key rotation on quota errors.
 *
 * @param apiCall - A function that takes a fresh YouTube API client and executes the desired call.
 * @param retries - The number of remaining retries, which should be the number of available API keys.
 * @returns The result of the API call.
 * @throws An error if all API keys are exhausted or a non-quota error occurs.
 */
async function executeWithRotation(
    apiCall: (youtubeClient: youtube_v3.Youtube) => Promise<any>,
    retries: number
): Promise<any> {
    const apiKey = await getActiveApiKey();
    if (!apiKey) {
        throw new Error('No YouTube API Key is configured. Please add one in Admin > Settings > API Keys.');
    }
    
    if (retries < 0) {
        throw new Error('All available YouTube API keys have exceeded their quota.');
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
        const isQuotaError = error.errors?.some((e: any) => e.reason === 'quotaExceeded') || error.message.includes('quota');

        if (isQuotaError) {
            console.warn(`[YouTube Client] Quota exceeded for API key. Rotating to the next key...`);
            // Rotate to the next key.
            await rotateApiKey();
            // Retry the call with the new key and one less retry attempt.
            return executeWithRotation(apiCall, retries - 1);
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
    const keysString = await getApiKeysAsString();
    const keys = keysString.split(',').filter(Boolean);
    const initialRetries = keys.length > 0 ? keys.length -1 : 0;

    // This object mimics the structure of the googleapis youtube client.
    // Each function we need is wrapped with the rotation logic.
    return {
        search: {
            list: (params: youtube_v3.Params$Resource$Search$List) => 
                executeWithRotation(client => client.search.list(params), initialRetries)
        },
        channels: {
            list: (params: youtube_v3.Params$Resource$Channels$List) => 
                executeWithRotation(client => client.channels.list(params), initialRetries)
        },
        playlistItems: {
            list: (params: youtube_v3.Params$Resource$Playlistitems$List) =>
                executeWithRotation(client => client.playlistItems.list(params), initialRetries)
        },
        videos: {
            list: (params: youtube_v3.Params$Resource$Videos$List) =>
                executeWithRotation(client => client.videos.list(params), initialRetries)
        }
    };
}


// A helper to get keys from the environment variable. This is needed because
// we can't call server actions directly from this file if they are not async.
// Since getApiKeys() is a server action now, we'll make a small helper.
async function getApiKeysAsString(): Promise<string> {
    return process.env.YOUTUBE_API_KEYS || '';
}
