'use server';

/**
 * The YouTube Data API client has been temporarily disabled to allow the application
 * to deploy successfully. The current cloud environment requires additional permissions
 * that were causing server startup failures.
 */
export async function getYoutubeClient() {
    return {
        /**
         * Executes an API call using the managed client.
         * This will always throw an error as the feature is disabled.
         */
        execute: async (apiCall: (client: any) => Promise<any>) => {
             throw new Error("YouTube API integration is temporarily disabled due to server configuration issues.");
        }
    };
}
