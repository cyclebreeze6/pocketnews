
'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

/**
 * Simple in-memory store for the current API key index.
 * Persists across calls within the same server instance.
 */
let currentKeyIndex = 0;

/**
 * Advances the pointer to the next API key in the pool.
 */
async function rotateApiKey() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length > 0) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`[YouTube API] Key rotated. Now using index ${currentKeyIndex + 1} of ${apiKeys.length}`);
    }
}

/**
 * Returns a configured YouTube client using the current active key index.
 */
async function getYouTubeClientInstance() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        return null;
    }
    // Ensure index is within bounds
    const index = currentKeyIndex % apiKeys.length;
    const apiKey = apiKeys[index];
    
    return google.youtube({
        version: 'v3',
        auth: apiKey,
    });
}

/**
 * Executes a YouTube Data API call with proactive and reactive API key rotation.
 * Proactive: Rotates on every call to getYoutubeClient to distribute load.
 * Reactive: Rotates again if a quota or auth error occurs.
 */
export async function getYoutubeClient() {
    // PROACTIVE ROTATION:
    // We advance the index immediately when a client is requested.
    // Since fetchChannelVideos is called per-channel in sync loops, 
    // this ensures we use a different key for almost every channel.
    await rotateApiKey();

    return {
        execute: async function execute<T>(apiCall: (client: youtube_v3.Youtube) => Promise<T>): Promise<T> {
            const apiKeys = await getApiKeys();
            
            let attempts = 0;
            const maxAttempts = apiKeys.length > 0 ? apiKeys.length : 1;

            if (apiKeys.length === 0) {
                throw new Error('YouTube API is restricted: No active API keys configured.');
            }

            while (attempts < maxAttempts) {
                try {
                    const youtube = await getYouTubeClientInstance();
                    if (!youtube) {
                        throw new Error('No valid YouTube client instance could be created.');
                    }
                    return await apiCall(youtube);
                } catch (error: any) {
                    const errorMessage = error.message?.toLowerCase() || '';
                    const errorReason = error.errors?.[0]?.reason || '';
                    
                    // Detect common reasons to rotate: Quota full, Invalid Key, or Rate Limited
                    const isQuotaError = 
                        error.code === 403 || 
                        errorMessage.includes('quota') || 
                        errorReason === 'quotaExceeded';

                    const isKeyError = 
                        error.code === 400 || 
                        errorMessage.includes('key') || 
                        errorMessage.includes('invalid') ||
                        errorReason === 'keyInvalid';

                    if ((isQuotaError || isKeyError) && apiKeys.length > 1) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            console.warn(`[YouTube API] Key ${currentKeyIndex + 1} hit a limit (${errorReason}). Reactively rotating...`);
                            await rotateApiKey();
                            continue;
                        }
                    }
                    
                    // If we've exhausted all keys or it's a non-retryable error
                    console.error(`[YouTube API] Critical failure:`, errorMessage);
                    throw error;
                }
            }
            
            throw new Error('All YouTube API keys have failed or exhausted their quotas.');
        }
    };
}
