import { NextRequest, NextResponse } from 'next/server';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

export const maxDuration = 540;

/**
 * CRON Group B: Syncs channels starting with M-Z.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Process second half of alphabet
    const result = await syncYouTubeChannels({ start: 'M', end: 'Z' });
    
    return NextResponse.json({ 
      success: true, 
      group: 'M-Z',
      message: `Sync M-Z completed. Added ${result.newVideosAdded} videos.`,
      ...result 
    });
  } catch (error: any) {
    console.error('Cron M-Z failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
