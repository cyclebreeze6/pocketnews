import { NextRequest, NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';
import { isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';

export const maxDuration = 540; 

/**
 * High-frequency cron to ensure the 'Breaking News' category is always fresh.
 * Scans all active sources but only for the very latest single video.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret
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
      message: `Breaking News sync completed. Added ${result.newVideosAdded} new items.`,
      ...result 
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
