'use server';

/**
 * Manages API keys.
 * IMPORTANT: To use the automated setup features, you MUST replace the keys below 
 * with valid YouTube Data API v3 keys from your Google Cloud Console.
 */

// Placeholder keys. Replace these with your actual keys for the system to work.
const API_KEYS = [
    'REPLACE_WITH_YOUR_REAL_KEY_1',
    'REPLACE_WITH_YOUR_REAL_KEY_2',
    'REPLACE_WITH_YOUR_REAL_KEY_3',
];


export async function getApiKeys(): Promise<string[]> {
  // Filter out placeholders if they haven't been replaced yet
  return API_KEYS.filter(key => key !== '' && !key.startsWith('REPLACE_WITH'));
}

export async function addApiKey(key: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are managed in the source code for security.' };
}

export async function removeApiKey(keyToRemove: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are managed in the source code for security.' };
}
