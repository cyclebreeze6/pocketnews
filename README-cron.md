# Cron Schedules for AI Auto-Post & Channel Sync

This project utilizes **Vercel Cron Jobs** defined in [`vercel.json`](file:///Users/faith_olaniyi/Documents/GitHub/pocketnews/vercel.json) when deployed in production on Vercel.

## Production Vercel Crons
Vercel automatically triggers the following Next.js API endpoints based on the `vercel.json` schedule:
- **Breaking News Sync**: Every 20 minutes (`/api/cron/sync-breaking-news`)
- **All Channels Sync**: Every 1 hour (`/api/cron/sync-all-channels`)
- **Remaining Channels Sync**: Every hour at :30 (`/api/cron/sync-remaining-channels`)
- **Shorts Sync**: Every 2 hours (`/api/cron/sync-shorts`)

Vercel automatically attaches the `x-vercel-cron` header and `Authorization: Bearer <CRON_SECRET>` (if set in Environment Variables).

## Local Cron Daemon
For local development, `cron-daemon.mjs` runs the exact same schedules using `node-cron`:

```bash
npm run cron
```

*Ensure your local `.env.local` contains `CRON_SECRET` and `NEXTJS_BASE_URL` (default: `http://localhost:9002`).*
