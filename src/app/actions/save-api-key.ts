
'use server';

/**
 * Saves a given API key to a server-side environment variable for the current session.
 * 
 * THIS IS NOT A SECURE PRODUCTION PRACTICE for long-term secrets.
 * In a real-world, scalable production app, use a dedicated secret manager.
 * For App Hosting, this is suitable for session-based credentials.
 */
export async function saveApiKey(key: string, value: string): Promise<{ success: boolean, message: string }> {
  try {
    if (!key || !value) {
        return { success: false, message: 'Key and value cannot be empty.' };
    }
    
    // Set the environment variable for the current process.
    // This makes it available immediately without a server restart.
    process.env[key] = value;

    return { success: true, message: `${key} saved for this session.` };
  } catch (error: any) {
    console.error(`Failed to save ${key}:`, error);
    return { success: false, message: `Failed to save the API key. ${error.message}` };
  }
}
