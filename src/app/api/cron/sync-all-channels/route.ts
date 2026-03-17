import { NextRequest, NextResponse } from 'next/server';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

export const maxDuration = 540;

/**
 * CRON Group A: Syncs channels starting with A-L (and numbers/symbols).
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
    console.error('[Cron] Unauthorized attempt to trigger Group A sync.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Starting Group A sync (A-L)...');

  try {
    const result = await syncYouTubeChannels({ start: 'A', end: 'L' });
    
    console.log(`[Cron] Group A completed. Channels: ${result.syncedChannels}, New Videos: ${result.newVideosAdded}`);

    return NextResponse.json({ 
      success: true, 
      group: 'A-L',
      timestamp: new Date().toISOString(),
      message: `Sync A-L completed. Added ${result.newVideosAdded} videos from ${result.syncedChannels} channels.`,
      stats: {
        newVideos: result.newVideosAdded,
        channelsSynced: result.syncedChannels
      }
    });
  } catch (error: any) {
    console.error('[Cron] Group A failed:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
