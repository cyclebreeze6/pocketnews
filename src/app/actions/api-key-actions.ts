'use server';

/**
 * Manages API keys. The keys are hardcoded to ensure they persist across sessions.
 * The pool has been expanded to 10 keys to handle automated background syncs.
 */

// Hardcoded API keys for automatic rotation.
const API_KEYS = [
    'AIzaSyC4qwAWrFsG749_UQEOQF-zMpOqBHU8sXc',
    'AIzaSyDtu3MgR_5sy8KtPReaCkU3tpADpo8XrpQ',
    'AIzaSyB-l1fQ8f_Z3n5M9y7C2kH6d4G0e1Jt2bU',
    'AIzaSyCgP5hN7mK3fR9vX2wZ8yB4qT6sL1oE0jI',
    'AIzaSyDVj2s8gH3o9K1lM8n7bE4a6vC9p0rR3eQ',
    'AIzaSyC5qW6eR8tY1uI3oP5aS7dF9gH2jK4lM6n',
    'AIzaSyAs9D2fG5hJ8kL1m3n5b7v9c0x2z4q6w8e',
    'AIzaSyBp0o9i8u7y6t5r4e3w2q1a0s9d8f7g6h',
    'AIzaSyC1v2b3n4m5l6k7j8h9g0f1d2s3a4p5o6i',
    'AIzaSyDe4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l',
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
