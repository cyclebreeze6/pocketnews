import { NextRequest, NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';
import { isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';

export const maxDuration = 540; 

/**
 * High-frequency cron to ensure the 'Breaking News' category is always fresh.
 * Supports Authorization Header or ?secret= query parameter for cronjob.de compatibility.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret ||
    querySecret === cronSecret
  );

  if (!isAuthorized) {
    console.error('[Cron] Unauthorized attempt to trigger Breaking News sync.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Starting high-frequency Breaking News sync...');

  try {
    const result = await runAutoSyncBreakingNews();
    
    console.log(`[Cron] Breaking News sync completed. Added ${result.newVideosAdded} new items.`);
    
    return NextResponse.json({ 
      success: true, 
      adminActive: isFirebaseAdminInitialized,
      timestamp: new Date().toISOString(),
      message: `Breaking News sync completed. Added ${result.newVideosAdded} new items.`,
      newVideosAdded: result.newVideosAdded,
      syncedChannels: result.syncedChannels
    });
  } catch (error: any) {
    console.error('[Cron] Breaking News sync failed:', error.message);
    return NextResponse.json({ 
        success: false, 
        adminActive: isFirebaseAdminInitialized,
        message: error.message 
    }, { status: 500 });
  }
}
