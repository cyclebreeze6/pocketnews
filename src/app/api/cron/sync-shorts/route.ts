import { NextRequest, NextResponse } from 'next/server';
import { syncShortsAction } from '../../../actions/sync-shorts-action';

export const maxDuration = 540;

/**
 * Automated cron job to sync Shorts from active channels.
 * Uses the shared server action for consistency and reliability.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret
  );

  if (!isAuthorized) {
    console.error('[Cron] Unauthorized attempt to trigger Shorts sync.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Starting Shorts auto-sync cron...');

  try {
    const result = await syncShortsAction();
    
    console.log(`[Cron] Shorts sync completed. Scanned ${result.synced} channels, added ${result.count} new shorts.`);

    return NextResponse.json({ 
        success: true, 
        message: `Shorts sync completed. Added ${result.count} new shorts from ${result.synced} channels.`,
        ...result
    });
  } catch (error: any) {
    console.error('[Cron] Shorts sync failed:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
