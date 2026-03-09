'use server';

/**
 * Manages API keys for the YouTube Data API.
 * Primary source: Environment variables YOUTUBE_API_KEY_1 through YOUTUBE_API_KEY_10.
 * Secondary source: The HARDCODED_KEYS array below for persistent storage.
 */

const HARDCODED_KEYS: string[] = [
    'AIzaSyDtu3MgR_5sy8KtPReaCkU3tpADpo8XrpQ', // Key 1
    'AIzaSyC4qwAWrFsG749_UQEOQF-zMpOqBHU8sXc', // Key 2
    '', // Key 3
    '', // Key 4
    '', // Key 5
    '', // Key 6
    '', // Key 7
    '', // Key 8
    '', // Key 9
    '', // Key 10
];

const ENV_KEYS = [
    process.env.YOUTUBE_API_KEY_1 || '',
    process.env.YOUTUBE_API_KEY_2 || '',
    process.env.YOUTUBE_API_KEY_3 || '',
    process.env.YOUTUBE_API_KEY_4 || '',
    process.env.YOUTUBE_API_KEY_5 || '',
    process.env.YOUTUBE_API_KEY_6 || '',
    process.env.YOUTUBE_API_KEY_7 || '',
    process.env.YOUTUBE_API_KEY_8 || '',
    process.env.YOUTUBE_API_KEY_9 || '',
    process.env.YOUTUBE_API_KEY_10 || '',
];


export async function getApiKeys(): Promise<string[]> {
  const allKeys = [...ENV_KEYS, ...HARDCODED_KEYS];
  // Filter out placeholders, empty strings, and template text
  return allKeys.filter(key => 
    key !== '' && 
    key !== null && 
    !key.startsWith('REPLACE_WITH') && 
    !key.includes('YOUR_KEY')
  );
}

export async function addApiKey(key: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are managed via the source code (api-key-actions.ts) or environment variables.' };
}

export async function removeApiKey(keyToRemove: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are managed via the source code or environment variables.' };
}
