import { NextRequest, NextResponse } from 'next/server';
import { syncChannelsStateful } from '../../../../ai/flows/sync-channels-flow';

export const maxDuration = 540;

/**
 * INTERNAL SYNC ENGINE: 
 * Uses stateful cursor-based processing to handle all channels over multiple runs.
 * Supports Google Internal Headers or CRON_SECRET authentication.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // App Hosting / Cloud Scheduler internal header
  const isInternalGoogleTrigger = request.headers.get('x-appengine-cron') === 'true' || request.headers.get('x-cloudscheduler') === 'true';

  const isAuthorized = isInternalGoogleTrigger || (cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret ||
    querySecret === cronSecret
  ));

  if (!isAuthorized) {
    console.error('[Cron] Unauthorized attempt to trigger Internal Sync Engine.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Triggering Internal Sync Engine Batch...');

  try {
    // Process a batch of 50. Since we have a 9-minute timeout on GCP internal routes,
    // this is perfectly safe and highly efficient.
    const result = await syncChannelsStateful(50);
    
    console.log(`[Cron] Batch complete. Synced: ${result.syncedChannels}, New: ${result.newVideosAdded}. Message: ${result.message || 'Success'}`);

    return NextResponse.json({ 
      success: true, 
      type: 'internal-stateful-loop',
      timestamp: new Date().toISOString(),
      message: result.message || 'Batch processed.',
      stats: {
        newVideos: result.newVideosAdded,
        channelsSynced: result.syncedChannels
      }
    });
  } catch (error: any) {
    console.error('[Cron] Internal Sync Engine failed critical error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
