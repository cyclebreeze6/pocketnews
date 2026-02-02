'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

// Simple in-memory store for the current API key index.
// This will reset on server restart, which is acceptable.
let currentKeyIndex = 0;

async function getYouTubeClientInstance() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        throw new Error('No YouTube API keys are configured.');
    }
    const apiKey = apiKeys[currentKeyIndex];
    return google.youtube({
        version: 'v3',
        auth: apiKey,
    });
}

async function rotateApiKey() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length > 0) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    }
}

/**
 * Executes a YouTube Data API call with automatic API key rotation on quota errors.
 * @param apiCall A function that receives the YouTube client and performs the API call.
 */
export async function getYoutubeClient() {
    return {
        execute: async function execute<T>(apiCall: (client: youtube_v3.Youtube) => Promise<T>): Promise<T> {
            const apiKeys = await getApiKeys();
            if (apiKeys.length === 0) {
                throw new Error('YouTube integration is disabled: No API keys configured.');
            }

            try {
                const youtube = await getYouTubeClientInstance();
                return await apiCall(youtube);
            } catch (error: any) {
                // Check if it's a quota exceeded error.
                if (error.code === 403 && (error.message?.includes('quotaExceeded') || error.message?.includes('dailyLimitExceeded'))) {
                    console.warn(`API key quota exceeded. Rotating to the next key.`);
                    await rotateApiKey();
                    
                    // Retry with the new key
                    const youtube = await getYouTubeClientInstance();
                    return await apiCall(youtube);
                }
                // For other errors, re-throw them.
                throw error;
            }
        }
    };
}
