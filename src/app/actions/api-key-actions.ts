'use server';

/**
 * Manages API keys. The keys are hardcoded to ensure they persist across sessions.
 * The UI for managing multiple keys has been disabled as a result.
 */

// Hardcoded API keys as requested for automatic rotation.
const API_KEYS = [
    'AIzaSyC4qwAWrFsG749_UQEOQF-zMpOqBHU8sXc',
    'AIzaSyDtu3MgR_5sy8KtPReaCkU3tpADpo8XrpQ',
    'AIzaSyB-l1fQ8f_Z3n5M9y7C2kH6d4G0e1Jt2bU',
    'AIzaSyCgP5hN7mK3fR9vX2wZ8yB4qT6sL1oE0jI',
];


export async function getApiKeys(): Promise<string[]> {
  return [...API_KEYS];
}

export async function addApiKey(key: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are hardcoded and cannot be changed from the UI.' };
}

export async function removeApiKey(keyToRemove: string): Promise<{ success: boolean, message: string }> {
  return { success: false, message: 'API keys are hardcoded and cannot be changed from the UI.' };
}
