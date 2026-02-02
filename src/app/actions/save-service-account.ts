'use server';

/**
 * This action is disabled. Service account credentials cannot be managed from the UI
 * in this hosting environment. They must be configured securely through environment variables.
 */
export async function saveServiceAccount(jsonData: string): Promise<{ success: boolean, message: string }> {
  console.warn('[saveServiceAccount] This feature is disabled. Filesystem access is restricted.');
  return { 
    success: false, 
    message: 'This feature is disabled. Credentials must be managed via secure environment variables.' 
  };
}
