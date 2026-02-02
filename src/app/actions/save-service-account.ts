'use server';

/**
 * This feature is temporarily disabled as writing to the filesystem is not
 * permitted in the current server environment, and the firebase-admin package has been removed for stability.
 */
export async function saveServiceAccount(jsonData: string): Promise<{ success: boolean, message: string }> {
  console.warn('saveServiceAccount is disabled.');
  return {
    success: false,
    message: 'This feature is temporarily disabled due to server environment restrictions.',
  };
}
