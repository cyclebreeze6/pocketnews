'use server';
// This is a server-only module
import { google } from 'googleapis';
import 'dotenv/config';

let youtubeClient: any = null;

export function getYoutubeClient() {
    if (!process.env.YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY is not set in the environment variables.');
    }
    if (!youtubeClient) {
        youtubeClient = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
        });
    }
    return youtubeClient;
}
