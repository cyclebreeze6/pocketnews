import cron from 'node-cron';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.warn('⚠️  CRON_SECRET is not set in .env.local!');
  console.warn('Authentication with the Next.js API might fail if it requires a secret.');
} else {
  console.log('✅ CRON_SECRET loaded successfully.');
}

const NEXTJS_BASE_URL = process.env.NEXTJS_BASE_URL || 'http://localhost:9002';

/**
 * Helper function to trigger a Next.js API route
 */
function triggerSyncRoute(endpointName, uri) {
  console.log(`[${new Date().toISOString()}] 🔄 Triggering: ${endpointName}`);
  
  const targetUrl = new URL(uri, NEXTJS_BASE_URL);
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.pathname + targetUrl.search,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[${new Date().toISOString()}] ✅ Success (${endpointName}): ${data}`);
      } else {
        console.error(`[${new Date().toISOString()}] ❌ Failed (${endpointName}) [Status Context: ${res.statusCode}]: ${data}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`[${new Date().toISOString()}] 🚨 Network Error (${endpointName}): ${e.message}`);
    console.error(`Make sure the Next.js app is running at ${NEXTJS_BASE_URL}`);
  });

  req.end();
}

console.log('🚀 Starting Standalone Cron Daemon...');
console.log(`Targeting Next.js API at: ${NEXTJS_BASE_URL}`);

// 1. Sync Breaking News (Every 20 minutes)
cron.schedule('*/20 * * * *', () => {
  triggerSyncRoute('Breaking News Sync', '/api/cron/sync-breaking-news');
});

// 2. Sync All Active Channels (Every 1 hour)
cron.schedule('0 * * * *', () => {
  triggerSyncRoute('All Channels Sync', '/api/cron/sync-all-channels');
});

// 3. Sync Remaining Channels (At minute 30 past every hour)
cron.schedule('30 * * * *', () => {
  triggerSyncRoute('Remaining Channels Sync', '/api/cron/sync-remaining-channels');
});

// 4. Sync Shorts (Every 2 hours)
cron.schedule('0 */2 * * *', () => {
  triggerSyncRoute('Shorts Sync', '/api/cron/sync-shorts');
});

console.log('🕒 Cron schedules loaded. Waiting for next interval...');
