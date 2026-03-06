'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

// Simple in-memory store for the current API key index.
let currentKeyIndex = 0;

async function getYouTubeClientInstance() {
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        throw new Error('No YouTube API keys are configured.');
    }
    // Ensure index is within bounds
    const index = currentKeyIndex % apiKeys.length;
    const apiKey = apiKeys[index];
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
 * Executes a YouTube Data API call with exhaustive API key rotation.
 * It will attempt every key in the pool if it hits an authorization or quota error.
 * @param apiCall A function that receives the YouTube client and performs the API call.
 */
export async function getYoutubeClient() {
    return {
        execute: async function execute<T>(apiCall: (client: youtube_v3.Youtube) => Promise<T>): Promise<T> {
            const apiKeys = await getApiKeys();
            if (apiKeys.length === 0) {
                throw new Error('YouTube integration is disabled: No API keys configured.');
            }

            let attempts = 0;
            const maxAttempts = apiKeys.length;

            while (attempts < maxAttempts) {
                try {
                    const youtube = await getYouTubeClientInstance();
                    return await apiCall(youtube);
                } catch (error: any) {
                    const errorMessage = error.message?.toLowerCase() || '';
                    const errorReason = error.errors?.[0]?.reason || '';
                    
                    // Identify errors that should trigger a key rotation:
                    // 403: Quota exceeded or Access not configured
                    // 400: Invalid key (keyInvalid)
                    // 429: Rate limit exceeded
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

                    if (isRetryable) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            console.warn(`YouTube API error with key index ${currentKeyIndex % apiKeys.length}. Reason: ${errorReason || errorMessage}. Rotating to next key... (Attempt ${attempts + 1}/${maxAttempts})`);
                            await rotateApiKey();
                            continue; // Retry the loop with the newly rotated key
                        }
                    }
                    
                    // If it's not a retryable error, or we've exhausted all keys, throw the final error.
                    if (attempts >= maxAttempts) {
                        console.error('CRITICAL: All available YouTube API keys have failed or exhausted their daily quota.');
                    }
                    throw error;
                }
            }
            
            throw new Error('Could not complete request: All YouTube API keys in the pool failed.');
        }
    };
}
