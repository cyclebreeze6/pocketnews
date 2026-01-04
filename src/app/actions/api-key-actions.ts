
'use server';

/**
 * Manages API keys stored in a server-side environment variable for the current session.
 * 
 * THIS IS NOT A SECURE PRODUCTION PRACTICE for long-term secrets.
 * In a real-world, scalable production app, use a dedicated secret manager.
 * For App Hosting, this is suitable for session-based credentials.
 */

// We'll store keys as a comma-separated string in the env var.
const API_KEYS_ENV_VAR = 'YOUTUBE_API_KEYS';
const ACTIVE_KEY_INDEX_VAR = 'YOUTUBE_API_KEY_INDEX';

function getKeys(): string[] {
  const keysString = process.env[API_KEYS_ENV_VAR] || '';
  return keysString ? keysString.split(',') : [];
}

function setKeys(keys: string[]): void {
  process.env[API_KEYS_ENV_VAR] = keys.join(',');
}

function getActiveIndex(): number {
  return parseInt(process.env[ACTIVE_KEY_INDEX_VAR] || '0', 10);
}

function setActiveIndex(index: number): void {
  process.env[ACTIVE_KEY_INDEX_VAR] = index.toString();
}

export async function getApiKeys(): Promise<string[]> {
  return getKeys();
}

export async function addApiKey(key: string): Promise<{ success: boolean, message: string }> {
  try {
    if (!key) {
      return { success: false, message: 'Key cannot be empty.' };
    }
    
    const currentKeys = getKeys();
    if (currentKeys.includes(key)) {
        return { success: false, message: 'This API key has already been added.' };
    }

    const newKeys = [...currentKeys, key];
    setKeys(newKeys);

    return { success: true, message: `API Key added successfully.` };
  } catch (error: any) {
    console.error(`Failed to save API key:`, error);
    return { success: false, message: `Failed to save the API key. ${error.message}` };
  }
}

export async function removeApiKey(keyToRemove: string): Promise<{ success: boolean, message: string }> {
  try {
    const currentKeys = getKeys();
    const newKeys = currentKeys.filter(k => k !== keyToRemove);

    if (newKeys.length === currentKeys.length) {
        return { success: false, message: 'API key not found.' };
    }
    
    setKeys(newKeys);
    // Reset index to avoid out-of-bounds
    if (getActiveIndex() >= newKeys.length) {
      setActiveIndex(0);
    }

    return { success: true, message: 'API Key removed successfully.' };
  } catch (error: any) {
    console.error('Failed to remove API key:', error);
    return { success: false, message: `Failed to remove the API key. ${error.message}` };
  }
}

// These functions are for internal server use by the youtube-client
export async function getActiveApiKey(): Promise<string | null> {
    const keys = getKeys();
    if (keys.length === 0) return null;
    
    const index = getActiveIndex();
    return keys[index % keys.length] || null;
}

export async function rotateApiKey(): Promise<string | null> {
    const keys = getKeys();
    if (keys.length <= 1) {
        // Can't rotate if there's only one or zero keys
        return getActiveApiKey();
    }
    
    const currentIndex = getActiveIndex();
    const nextIndex = (currentIndex + 1) % keys.length;
    setActiveIndex(nextIndex);
    
    console.log(`[API Key Manager] Rotated API key from index ${currentIndex} to ${nextIndex}.`);
    
    return keys[nextIndex] || null;
}
