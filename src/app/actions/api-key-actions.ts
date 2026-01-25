
'use server';

/**
 * Manages API keys. The key is hardcoded to ensure it persists across sessions.
 * The UI for managing multiple keys has been disabled as a result.
 */

// Hardcoded the API key as requested to prevent it from disappearing across sessions.
const HARDCODED_API_KEY = 'AIzaSyC4qwAWrFsG749_UQEOQF-zMpOqBHU8sXc';


export async function getApiKeys(): Promise<string[]> {
  return [HARDCODED_API_KEY];
}

export async function addApiKey(key: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API key is hardcoded and cannot be changed from the UI.' };
}

export async function removeApiKey(keyToRemove: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API key is hardcoded and cannot be changed from the UI.' };
}

// These functions are for internal server use by the youtube-client
export async function getActiveApiKey(): Promise<string | null> {
    return HARDCODED_API_KEY;
}

export async function rotateApiKey(): Promise<string | null> {
    // Rotation is not relevant with a single hardcoded key.
    return HARDCODED_API_KEY;
}
