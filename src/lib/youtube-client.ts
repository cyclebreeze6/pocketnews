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
 * It will attempt every key in the pool before giving up.
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
                    // Check if it's a quota exceeded error by inspecting code and message patterns.
                    const isQuotaError = 
                        (error.code === 403 || error.code === 429) && (
                        error.errors?.[0]?.reason === 'quotaExceeded' ||
                        error.errors?.[0]?.reason === 'dailyLimitExceeded' ||
                        error.errors?.[0]?.reason === 'rateLimitExceeded' ||
                        error.message?.toLowerCase().includes('quota') ||
                        error.message?.toLowerCase().includes('limit')
                    );

                    if (isQuotaError) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            console.warn(`YouTube Quota limit hit for key index ${currentKeyIndex % maxAttempts}. Rotating to next key... (Attempt ${attempts + 1}/${maxAttempts})`);
                            await rotateApiKey();
                            continue; // Retry the loop with the newly rotated key
                        }
                    }
                    
                    // If it's not a quota error, or we've exhausted all keys, throw the final error.
                    if (attempts >= maxAttempts) {
                        console.error('CRITICAL: All YouTube API keys have exhausted their daily quota.');
                    }
                    throw error;
                }
            }
            
            throw new Error('Could not complete request: All YouTube API keys are currently at their limit.');
        }
    };
}
