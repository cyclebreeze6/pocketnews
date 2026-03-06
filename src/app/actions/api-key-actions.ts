
'use server';

/**
 * Manages API keys.
 * Primary source is environment variables YOUTUBE_API_KEY_1 through YOUTUBE_API_KEY_5.
 * Fallback is the hardcoded array for quick testing (NOT RECOMMENDED for production).
 */

const API_KEYS = [
    process.env.YOUTUBE_API_KEY_1 || '',
    process.env.YOUTUBE_API_KEY_2 || '',
    process.env.YOUTUBE_API_KEY_3 || '',
    process.env.YOUTUBE_API_KEY_4 || '',
    process.env.YOUTUBE_API_KEY_5 || '',
];


export async function getApiKeys(): Promise<string[]> {
  // Filter out placeholders and empty strings
  return API_KEYS.filter(key => key !== '' && !key.startsWith('REPLACE_WITH'));
}

export async function addApiKey(key: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are managed via environment variables for security.' };
}

export async function removeApiKey(keyToRemove: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are managed via environment variables for security.' };
}
