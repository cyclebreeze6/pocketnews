import { NextRequest, NextResponse } from 'next/server';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

export const maxDuration = 540;

/**
 * CRON Group A: Syncs channels starting with A-L (and numbers/symbols).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret
  );

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await syncYouTubeChannels({ start: 'A', end: 'L' });
    
    return NextResponse.json({ 
      success: true, 
      group: 'A-L',
      message: `Sync A-L completed. Added ${result.newVideosAdded} videos.`,
      ...result 
    });
  } catch (error: any) {
    console.error('Cron A-L failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
