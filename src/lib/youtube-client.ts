'use server';

import { google, youtube_v3 } from 'googleapis';
import { getApiKeys } from '../app/actions/api-key-actions';
import { adminSDK, isFirebaseAdminInitialized } from './firebase-admin';

/**
 * Fetches the current API key index from Firestore metadata.
 */
async function getStoredKeyIndex(): Promise<number> {
    if (!isFirebaseAdminInitialized) return 0;
    try {
        const stateDoc = await adminSDK.firestore().doc('metadata/api_state').get();
        return stateDoc.exists ? (stateDoc.data()?.lastUsedIndex ?? 0) : 0;
    } catch {
        return 0;
    }
}

/**
 * Advances the global API rotation index to the next key.
 * Should be called at the start of a sync run.
 */
export async function advanceApiKeyRotation(): Promise<void> {
    if (!isFirebaseAdminInitialized) return;
    const apiKeys = await getApiKeys();
    if (apiKeys.length <= 1) return;
    
    try {
        const ref = adminSDK.firestore().doc('metadata/api_state');
        const stateDoc = await ref.get();
        const currentIndex = stateDoc.exists ? (stateDoc.data()?.lastUsedIndex ?? 0) : 0;
        const nextIndex = (currentIndex + 1) % apiKeys.length;
        
        await ref.set({ 
            lastUsedIndex: nextIndex,
            lastRotatedAt: adminSDK.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`[YouTube API] Rotation advanced: Using Key #${nextIndex + 1} for this cycle.`);
    } catch (e) {
        console.error("[YouTube API] Failed to advance rotation:", e);
    }
}

/**
 * Returns a configured YouTube client using an API key determined by the persisted rotation index.
 * 
 * @param baseIndex - The starting index for this run.
 * @param offset - Used during retries to try the next key if the primary one is exhausted.
 */
async function getYouTubeClientInstance(baseIndex: number, offset: number = 0) {
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        return null;
    }

    // Calculate index: (base + offset) mod totalKeys
    const index = (baseIndex + offset) % apiKeys.length;
    const apiKey = apiKeys[index];
    
    console.log(`[YouTube API] Run Instance: Using key #${index + 1} (Attempt ${offset + 1}).`);
    
    return google.youtube({
        version: 'v3',
        auth: apiKey,
    });
}

/**
 * Executes a YouTube Data API call with persistent sequential rotation and error recovery.
 */
export async function getYoutubeClient() {
    const baseIndex = await getStoredKeyIndex();
    
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
                    const youtube = await getYouTubeClientInstance(baseIndex, attempts);
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
                    
                    console.error(`[YouTube API] Execution failed:`, errorMessage);
                    throw error;
                }
            }
            
            throw new Error('All available API keys for this run have exhausted their quotas.');
        }
    };
}
