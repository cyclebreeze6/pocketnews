'use server';

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Saves the service account JSON to a temporary file on the server.
 * In a real-world scenario, this should be handled by a secure secret manager.
 * For this demo, we write to a file that is git-ignored.
 * 
 * THIS IS NOT A SECURE PRODUCTION PRACTICE.
 */
export async function saveServiceAccount(jsonData: string): Promise<{ success: boolean, message: string }> {
  try {
    // Basic validation to check if it's a JSON string
    JSON.parse(jsonData);

    // In a real App Hosting environment, you can't rely on a writable filesystem like this.
    // This is a workaround for local dev and demo purposes.
    // The correct way is to use Secret Manager.
    const filePath = path.join(process.cwd(), '.service-account.json');
    await fs.writeFile(filePath, jsonData, 'utf8');

    // Also set the environment variable for the current process
    // This makes it available immediately without a server restart.
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = jsonData;

    return { success: true, message: 'Service Account credentials saved for this session. A server restart might be needed for changes to persist in all cases.' };
  } catch (error: any) {
    console.error('Failed to save service account key:', error);
    return { success: false, message: 'Invalid JSON format or failed to save the file. ' + error.message };
  }
}
