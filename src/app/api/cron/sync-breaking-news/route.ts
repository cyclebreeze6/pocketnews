import { NextRequest, NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';
import { isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';

export const maxDuration = 540; 

/**
 * High-frequency cron to ensure the 'Breaking News' category is always fresh.
 * Standardized authentication for internal and external triggers.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isInternalGoogleTrigger = 
    request.headers.get('x-appengine-cron') === 'true' || 
    request.headers.get('x-cloudscheduler') === 'true';

  const isAuthorized = isInternalGoogleTrigger || (cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret ||
    querySecret === cronSecret
  ));

  if (!isAuthorized) {
    console.error('[Cron] Unauthorized attempt to trigger Breaking News sync.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Starting High-Frequency Sync...');

  try {
    const result = await runAutoSyncBreakingNews();
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: `Sync completed. Added ${result.newVideosAdded} new items.`,
      stats: {
        newVideos: result.newVideosAdded,
        synced: result.syncedChannels
      }
    });
  } catch (error: any) {
    console.error('[Cron] Breaking News sync failed:', error.message);
    return NextResponse.json({ 
        success: false, 
        message: error.message 
    }, { status: 500 });
  }
}
