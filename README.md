# POCKETNEWS

PocketNews is a modern Next.js news & media platform configured for seamless deployment on **Vercel Hosting**.

## Deployment & Hosting (Vercel)

This application is configured for deployment on Vercel:

1. **Deploy to Vercel**: Connect your GitHub repository (`pocketnews`) directly to Vercel.
2. **Environment Variables**: Configure the required environment variables in your Vercel Project Settings (`Settings -> Environment Variables`):
   - `CRON_SECRET`: Secret key used for authenticating external/internal cron requests.
   - `FIREBASE_ADMIN_SERVICE_ACCOUNT` (or `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`): Firebase Admin credentials.
   - `NEXT_PUBLIC_FIREBASE_*`: Web client SDK configuration for Firebase Auth/Firestore.
   - `YOUTUBE_API_KEY`: API key for content ingestion.

3. **Vercel Cron Jobs**:
   Automatic background synchronization schedules are defined natively in [`vercel.json`](file:///Users/faith_olaniyi/Documents/GitHub/pocketnews/vercel.json):
   - `*/20 * * * *` -> `/api/cron/sync-breaking-news`
   - `0 * * * *` -> `/api/cron/sync-all-channels`
   - `30 * * * *` -> `/api/cron/sync-remaining-channels`
   - `0 */2 * * *` -> `/api/cron/sync-shorts`

## Local Development

```bash
npm run dev
```

To run local database rules or emulators for Firestore/Storage, use the Firebase CLI:
```bash
firebase emulators:start
```
