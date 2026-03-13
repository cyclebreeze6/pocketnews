
'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';

/**
 * Returns a configured YouTube client using an API key determined by the current hour.
 * This ensures one specific key is used per 1-hour block, distributing quota predictably across the day.
 * 
 * @param offset - Used during retries to try the next key if the primary hour key is exhausted.
 */
async function getYouTubeClientInstance(offset: number = 0) {
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        return null;
    }

    // Deterministically pick a key based on the current UTC hour (0-23)
    const currentHour = new Date().getUTCHours();
    
    // Calculate index: (hour + offset) mod totalKeys
    const index = (currentHour + offset) % apiKeys.length;
    const apiKey = apiKeys[index];
    
    // Logging for visibility in server logs
    if (offset === 0) {
        console.log(`[YouTube API] Deterministic Selection: Using key #${index + 1} for UTC hour ${currentHour}.`);
    } else {
        console.log(`[YouTube API] Fallback: Hour key failed. Using fallback key #${index + 1}.`);
    }
    
    return google.youtube({
        version: 'v3',
        auth: apiKey,
    });
}

/**
 * Executes a YouTube Data API call with time-based rotation and error recovery.
 */
export async function getYoutubeClient() {
    return {
        execute: async function execute<T>(apiCall: (client: youtube_v3.Youtube) => Promise<T>): Promise<T> {
            const apiKeys = await getApiKeys();
            
            let attempts = 0;
            const maxAttempts = Math.min(apiKeys.length, 3); // Attempt up to 3 keys if the primary one fails

            if (apiKeys.length === 0) {
                throw new Error('YouTube API is restricted: No active API keys configured.');
            }

            while (attempts < maxAttempts) {
                try {
                    const youtube = await getYouTubeClientInstance(attempts);
                    if (!youtube) {
                        throw new Error('No valid YouTube client instance could be created.');
                    }
                    return await apiCall(youtube);
                } catch (error: any) {
                    const errorMessage = error.message?.toLowerCase() || '';
                    const errorReason = error.errors?.[0]?.reason || '';
                    
                    // Detect common reasons to try a different key: Quota full or Auth issues
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
                            console.warn(`[YouTube API] Key attempt ${attempts} failed (${errorReason}). Trying next sequential key...`);
                            continue;
                        }
                    }
                    
                    // If we've hit non-retryable error or exhausted fallback limit
                    console.error(`[YouTube API] Execution failed:`, errorMessage);
                    throw error;
                }
            }
            
            throw new Error('The primary hour key and fallback keys have all failed or exhausted their quotas.');
        }
    };
}
