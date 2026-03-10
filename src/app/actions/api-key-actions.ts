'use server';

/**
 * Manages API keys for the YouTube Data API.
 * Primary source: Environment variables YOUTUBE_API_KEY_1 through YOUTUBE_API_KEY_10.
 * Secondary source: The HARDCODED_KEYS array below for persistent storage.
 */

const HARDCODED_KEYS: string[] = [
    'AIzaSyDtu3MgR_5sy8KtPReaCkU3tpADpo8XrpQ', // Key 1
    'AIzaSyC4qwAWrFsG749_UQEOQF-zMpOqBHU8sXc', // Key 2
    'AIzaSyBMf0WTsLQFteR6cPmTVps8_Gk4dpwGvVM', // Key 3
    'AIzaSyCblNc5gY1jAK6zyGvmb7Trtt0ao7xstiY', // Key 4
    'AIzaSyAEgBSJdvTTUjX6X7mIaiMCifEIm9oDzIU', // Key 5
    'AIzaSyAR2ZrdM0ebaCdsaLMk9e7Q4uRoiRwDijE', // Key 6
    'AIzaSyBmCbc2D0SZvVLVPKHpI3-7Lms3YUHzuSE', // Key 7
    'AIzaSyD8QJQH4e1O5oA1sPwCbeE1wCUMBxkvD2Q', // Key 8
    'AIzaSyClsxXyBAk3JVclUKzRKlH-64W_D9lhEsI', // Key 9
    'AIzaSyAr5BrZBq6HSvGkL9mauKtd8Ark6S14PVY', // Key 10
    'AIzaSyAEUauTicNs6B1qbyadTrgEDCykxZ6VrLU', // Key 11
    'AIzaSyC1c71sBbM9yJFyjICz5OazoSnERjf_34o', // Key 12
    'AIzaSyA0_4DVrKbrJ3oHtq4Ym9zq_UosYlOXOcE', // Key 13
    'AIzaSyDNYMIlIfFq8VZssJD2ZdqFd73P7EbyieA', // Key 14
    'AIzaSyDTy__pDXoCS07YMjB7FSdz5cZWg5NBJ6c', // Key 15
    'AIzaSyCK2by0_-veDpXJctHO_tgUfjVfztEiKFE', // Key 16
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
