
'use server';

import { google } from 'googleapis';
import { getActiveApiKey, rotateApiKey } from '../app/actions/api-key-actions';

/**
 * Executes a YouTube API request with automatic API key rotation on quota errors.
 * 
 * @param apiCall - A function that takes a YouTube API client and executes the desired call.
 * @param retries - The number of remaining retries (equal to the number of available keys).
 * @returns The result of the API call.
 * @throws An error if all API keys are exhausted or a non-quota error occurs.
 */
async function executeWithRotation(apiCall: (youtubeClient: any) => Promise<any>, retries: number): Promise<any> {
    const apiKey = getActiveApiKey();

    if (!apiKey) {
        throw new Error('No YouTube API Key is configured. Please add one in Admin > Settings > API Keys.');
    }
    
    if (retries < 0) {
        throw new Error('All available YouTube API keys have exceeded their quota.');
    }

    const youtubeClient = google.youtube({
        version: 'v3',
        auth: apiKey,
    });
    
    try {
        // Attempt the API call with the current client
        return await apiCall(youtubeClient);
    } catch (error: any) {
        // Check if the error is a quota error
        const isQuotaError = error.errors?.some((e: any) => e.reason === 'quotaExceeded');

        if (isQuotaError) {
            console.warn(`[YouTube Client] Quota exceeded for API key. Rotating to the next key...`);
            // Rotate to the next key
            rotateApiKey();
            // Retry the call with the new key and one less retry attempt
            return executeWithRotation(apiCall, retries - 1);
        } else {
            // If it's not a quota error, re-throw it immediately
            console.error('[YouTube Client] A non-quota API error occurred:', error.message);
            if (error.response?.data?.error?.message) {
                 throw new Error(`YouTube API Error: ${error.response.data.error.message}`);
            }
            throw new Error(error.message || 'An unknown YouTube API error occurred.');
        }
    }
}

/**
 * Creates a proxy-like object for the YouTube client that wraps each method
 * in the key rotation logic.
 * 
 * @returns A YouTube client object where methods handle API key rotation.
 */
export async function getYoutubeClient() {
    const keys = (process.env.YOUTUBE_API_KEYS || '').split(',').filter(Boolean);
    const initialRetries = keys.length;

    // This is the proxy handler that intercepts calls to the YouTube client
    const handler = {
        get(target: any, propKey: string, receiver: any) {
            const origMethod = target[propKey];
            if (typeof origMethod === 'function') {
                // If the property is a function, wrap it in our rotation logic
                return function (...args: any[]) {
                    // The `apiCall` function will be what `executeWithRotation` calls
                    const apiCall = (client: any) => client[propKey](...args);
                    return executeWithRotation(apiCall, initialRetries);
                };
            }
            // For nested objects like `youtube.search`, `youtube.channels`
            if (typeof origMethod === 'object' && origMethod !== null) {
                return new Proxy(origMethod, handler);
            }
            return Reflect.get(target, propKey, receiver);
        },
    };

    // Create a dummy client to be the proxy target.
    // The auth key here is irrelevant as it will be replaced by the active key.
    const dummyClient = google.youtube({ version: 'v3', auth: 'dummy_key' });
    
    // Return the proxied client
    return new Proxy(dummyClient, handler);
}
