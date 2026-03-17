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
    console.error('[Cron] Unauthorized attempt to trigger Internal Sync.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Starting Stateful Internal Sync Batch...');

  try {
    // Process a larger batch (50 channels) since we have a 9-minute internal timeout
    const result = await syncChannelsStateful(50);
    
    console.log(`[Cron] Sync completed. Channels: ${result.syncedChannels}, New Videos: ${result.newVideosAdded}`);

    return NextResponse.json({ 
      success: true, 
      type: 'stateful-internal',
      timestamp: new Date().toISOString(),
      message: `Sync completed. Added ${result.newVideosAdded} videos from ${result.syncedChannels} channels.`,
      stats: {
        newVideos: result.newVideosAdded,
        channelsSynced: result.syncedChannels
      }
    });
  } catch (error: any) {
    console.error('[Cron] Internal Sync failed:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
