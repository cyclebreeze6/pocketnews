import { NextRequest, NextResponse } from 'next/server';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

export const maxDuration = 540;

/**
 * CRON Group B: Syncs channels starting with M-Z.
 * This splits the workload to ensure completion within external 30s timeouts.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret
  );

  if (!isAuthorized) {
    console.error('[Cron] Unauthorized attempt to trigger Group B sync.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Starting Group B sync (M-Z)...');

  try {
    const result = await syncYouTubeChannels({ start: 'M', end: 'Z' });
    
    console.log(`[Cron] Group B completed. Channels: ${result.syncedChannels}, New Videos: ${result.newVideosAdded}`);

    return NextResponse.json({ 
      success: true, 
      group: 'M-Z',
      message: `Sync M-Z completed. Added ${result.newVideosAdded} videos from ${result.syncedChannels} channels.`,
      ...result 
    });
  } catch (error: any) {
    console.error('[Cron] Group B failed:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
