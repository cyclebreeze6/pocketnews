# Portable Cron Daemon for AI Auto-Post

This file (`cron-daemon.mjs`) ensures your auto-sync API routes are called even if you aren't hosting on Google Cloud App Hosting.

## How it works
The daemon uses `node-cron` to execute standard HTTP GET requests to your Next.js API routes on the exact same schedule defined in `apphosting.yaml`.

## How to use it
1. Make sure your Next.js application is running (`npm run dev` or `npm start`). By default, it runs on port 9002.
2. If your `.env.local` contains a `CRON_SECRET`, the daemon will automatically use it for authentication.
3. Open a second terminal window.
4. Run the daemon using:
   ```bash
   npm run cron
   ```

## Production use
If you use PM2, you can run the daemon continuously in the background alongside your Next.js app:
```bash
pm2 start cron-daemon.mjs --name next-cron-daemon
```

*Note: Ensure `NEXTJS_BASE_URL` is set to your production URL if you run the script on a different machine.*
