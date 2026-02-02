'use server';

import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Saves the service account JSON to a temporary file and sets the
 * GOOGLE_APPLICATION_CREDENTIALS environment variable for the current process.
 * This is for session-based use and is not persistent across server restarts.
 * 
 * Note: In many managed hosting environments, writing to the filesystem is restricted.
 * Using /tmp is often the only allowed directory.
 */
export async function saveServiceAccount(jsonData: string): Promise<{ success: boolean, message: string }> {
  try {
    // Use the OS's temporary directory
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `firebase-service-account-${Date.now()}.json`);

    // Write the file
    fs.writeFileSync(filePath, jsonData);

    // Set the environment variable for the current Node.js process
    process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;

    console.log(`Service account credentials set for this session: ${filePath}`);
    
    return { 
      success: true, 
      message: 'Credentials have been set for the current server session. They will be reset on server restart.' 
    };
  } catch (error: any) {
    console.error('Failed to save service account:', error);
    return {
      success: false,
      message: `Failed to write credentials file: ${error.message}. Filesystem access may be restricted in this environment.`
    };
  }
}
