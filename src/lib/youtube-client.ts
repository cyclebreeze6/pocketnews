'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

// Simple in-memory store for the current API key index.
let currentKeyIndex = 0;

async function getYouTubeClientInstance() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        return null;
    }
    // Ensure index is within bounds
    const index = currentKeyIndex % apiKeys.length;
    const apiKey = apiKeys[index];
    
    console.log(`[YouTube API] Using key index ${index + 1} of ${apiKeys.length}`);
    
    return google.youtube({
        version: 'v3',
        auth: apiKey,
    });
}

async function rotateApiKey() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length > 0) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.warn(`[YouTube API] Rotated to key index ${(currentKeyIndex % apiKeys.length) + 1}`);
    }
}

/**
 * Executes a YouTube Data API call with exhaustive API key rotation.
 * It will attempt every key in the pool if it hits an authorization or quota error.
 */
export async function getYoutubeClient() {
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
                    const isRetryable = 
                        error.code === 403 || 
                        error.code === 400 || 
                        error.code === 429 ||
                        errorMessage.includes('quota') ||
                        errorMessage.includes('limit') ||
                        errorMessage.includes('key') ||
                        errorMessage.includes('invalid') ||
                        errorReason === 'keyInvalid' ||
                        errorReason === 'quotaExceeded';

                    if (isRetryable && apiKeys.length > 1) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            console.error(`[YouTube API] Key error (${errorReason || 'Unknown'}). Rotating...`);
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
