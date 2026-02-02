'use server';

import { google, type youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

let activeKeys: string[] = [];
let currentKeyIndex = 0;

async function getClient(apiKey: string): Promise<youtube_v3.Youtube> {
  return google.youtube({
    version: 'v3',
    auth: apiKey,
  });
}

/**
 * Executes a YouTube API call with automatic API key rotation on quota errors.
 * @param apiCall - A function that takes a youtube client and performs the API call.
 * @returns The result of the API call.
 */
async function executeWithRotation(
    apiCall: (youtubeClient: youtube_v3.Youtube) => Promise<any>,
    keys: string[],
    keyIndex: number
): Promise<any> {
    if (keyIndex >= keys.length) {
        throw new Error('All YouTube API keys have been exhausted or are invalid.');
    }

    try {
        const currentKey = keys[keyIndex];
        const youtubeClient = await getClient(currentKey);
        // Store the key index that is about to be used.
        currentKeyIndex = keyIndex;
        return await apiCall(youtubeClient);
    } catch (error: any) {
        // Check if it's a quota error (403 is a common indicator)
        if (error.code === 403 && (error.message.includes('quota') || error.message.includes('Exceeded'))) {
            console.warn(`API key at index ${keyIndex} exhausted. Rotating to next key.`);
            // Recursively call with the next key
            return executeWithRotation(apiCall, keys, keyIndex + 1);
        }
        // For other errors, re-throw them
        throw error;
    }
}

/**
 * Gets a pre-configured YouTube Data API v3 client with automatic key rotation.
 * @returns An object with an `execute` method to run API calls.
 */
export async function getYoutubeClient() {
    if (activeKeys.length === 0) {
        activeKeys = await getApiKeys();
        if (activeKeys.length === 0) {
            throw new Error('No YouTube API keys are configured in the settings.');
        }
    }

    return {
        /**
         * Executes an API call using the managed client.
         * @param apiCall The function that receives the youtube client and makes the call.
         */
        execute: async (apiCall: (youtubeClient: youtube_v3.Youtube) => Promise<any>) => {
             // Start with the last known working key index
             return executeWithRotation(apiCall, activeKeys, currentKeyIndex);
        }
    };
}
