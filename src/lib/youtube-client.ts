
'use server';
// This is a server-only module
import { google } from 'googleapis';
import 'dotenv/config';

let youtubeClient: any = null;

export async function getYoutubeClient() {
    // process.env.YOUTUBE_API_KEY can be set by the save-api-key action at runtime
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        throw new Error('YOUTUBE_API_KEY is not set. Please add it in Admin > Settings > API Keys.');
    }
    
    // We don't cache the client if the key can change at runtime.
    // A more advanced implementation might cache based on the key itself.
    youtubeClient = google.youtube({
        version: 'v3',
        auth: apiKey,
    });
    
    return youtubeClient;
}
